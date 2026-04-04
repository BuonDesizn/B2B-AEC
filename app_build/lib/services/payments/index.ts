// @witness [MON-001]
import crypto from 'crypto';

import { SUBSCRIPTION_STATUS, MONTHLY_CREDITS } from '@/lib/constants';
import { db } from '@/lib/db';
import { generateChecksum, buildPaymentPayload, getPhonePeBaseUrl } from '@/lib/utils/phonepe';

// =============================================================================
// Payment Service
// =============================================================================

const PLAN_PRICES: Record<string, number> = {
  national_pro: 99900,
};

export interface InitPaymentResult {
  phonepe_order_id: string;
  redirect_url: string;
  expires_at: string;
}

export interface CallbackResult {
  merchantTransactionId: string;
  status: string;
  subscription_activated: boolean;
}

function extractUserIdFromTransactionId(merchantTransactionId: string): string {
  const parts = merchantTransactionId.split('_');
  if (parts.length < 3) {
    throw new Error('Invalid transaction ID format');
  }
  return parts.slice(1, -1).join('_');
}

export const paymentService = {
  /**
   * Initialize a subscription payment via PhonePe
   * @witness [MON-001]
   */
  async initPayment(userId: string, planName: string): Promise<InitPaymentResult> {
    const profile = await db
      .selectFrom('profiles')
      .select(['subscription_status'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.subscription_status === SUBSCRIPTION_STATUS.ACTIVE) {
      throw new Error('Subscription already active');
    }

    const planPrice = PLAN_PRICES[planName];
    if (!planPrice) {
      throw new Error(`Unknown plan: ${planName}`);
    }

    const transactionId = `txn_${userId}_${Date.now()}`;
    const merchantId = process.env.PHONEPE_MERCHANT_ID!;
    const merchantKey = process.env.PHONEPE_MERCHANT_KEY!;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    const baseUrl = getPhonePeBaseUrl();

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/phonepe/callback`;

    const paymentPayload = buildPaymentPayload(
      merchantId,
      transactionId,
      planPrice,
      redirectUrl
    );

    const payloadString = JSON.stringify(paymentPayload);
    const checksum = generateChecksum(payloadString, merchantKey, saltIndex);

    const response = await fetch(`${baseUrl}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
      },
      body: payloadString,
    });

    if (!response.ok) {
      throw new Error('Failed to initialize payment with PhonePe');
    }

    const data = await response.json();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return {
      phonepe_order_id: data.data?.merchantTransactionId || transactionId,
      redirect_url: data.data?.instrumentResponse?.redirectInfo?.url || redirectUrl,
      expires_at: expiresAt,
    };
  },

  /**
   * Handle PhonePe webhook callback
   * @witness [MON-001]
   */
  async handleCallback(webhookBody: any, signature: string): Promise<CallbackResult> {
    const salt = process.env.PHONEPE_MERCHANT_KEY!;
    const payload = JSON.stringify(webhookBody);

    const isValid = this.verifyPhonePeSignature(payload, signature, salt);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const { merchantTransactionId, state } = webhookBody;

    const userId = extractUserIdFromTransactionId(merchantTransactionId);

    const subscription = await db
      .selectFrom('subscriptions')
      .select(['phonepe_transaction_id', 'status'])
      .where('profile_id', '=', userId)
      .executeTakeFirst();

    if (subscription && subscription.phonepe_transaction_id === merchantTransactionId) {
      return {
        merchantTransactionId,
        status: subscription.status,
        subscription_activated: subscription.status === SUBSCRIPTION_STATUS.ACTIVE,
      };
    }

    if (state === 'COMPLETED') {
      return this.activateSubscription(merchantTransactionId);
    } else if (state === 'FAILED') {
      return this.failSubscription(merchantTransactionId);
    }

    throw new Error(`Unhandled payment state: ${state}`);
  },

  /**
   * Verify PhonePe webhook signature
   * @witness [MON-001]
   */
  verifyPhonePeSignature(payload: string, signature: string, salt: string): boolean {
    const base64Payload = Buffer.from(payload).toString('base64');
    const expectedHash = crypto
      .createHash('sha256')
      .update(base64Payload + salt)
      .digest('hex');
    return signature === expectedHash;
  },

  /**
   * Activate subscription after successful payment
   * @witness [MON-001]
   */
  async activateSubscription(merchantTransactionId: string): Promise<CallbackResult> {
    const userId = extractUserIdFromTransactionId(merchantTransactionId);

    const now = new Date();
    const periodEnd = new Date(now.getTime() + MONTHLY_CREDITS * 24 * 60 * 60 * 1000);

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('subscriptions')
        .set({
          status: SUBSCRIPTION_STATUS.ACTIVE,
          current_period_start: now,
          current_period_end: periodEnd,
          phonepe_transaction_id: merchantTransactionId,
          updated_at: now,
        })
        .where('profile_id', '=', userId)
        .execute();

      await trx
        .updateTable('profiles')
        .set({
          subscription_status: SUBSCRIPTION_STATUS.ACTIVE,
          handshake_credits: MONTHLY_CREDITS,
          last_credit_reset_at: now,
          updated_at: now,
        })
        .where('id', '=', userId)
        .execute();
    });

    return {
      merchantTransactionId,
      status: 'COMPLETED',
      subscription_activated: true,
    };
  },

  /**
   * Handle failed subscription payment
   * @witness [MON-001]
   */
  async failSubscription(merchantTransactionId: string): Promise<CallbackResult> {
    const userId = extractUserIdFromTransactionId(merchantTransactionId);

    const now = new Date();

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable('subscriptions')
        .set({
          status: SUBSCRIPTION_STATUS.EXPIRED,
          updated_at: now,
        })
        .where('profile_id', '=', userId)
        .execute();
    });

    console.log(`PAYMENT_FAILED notification for profile ${userId}`);

    return {
      merchantTransactionId,
      status: 'FAILED',
      subscription_activated: false,
    };
  },
};
