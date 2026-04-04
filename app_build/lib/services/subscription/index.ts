import { db } from '@/lib/db';
import { SUBSCRIPTION_STATUS, MONTHLY_CREDITS, TRIAL_DURATION_HOURS, TRIAL_LOCK_THRESHOLD_HOURS } from '@/lib/constants';

// =============================================================================
// Subscription State Machine
// =============================================================================

export type SubscriptionState = 'trial' | 'active' | 'expired' | 'hard_locked';

const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionState, SubscriptionState[]> = {
  trial: ['active', 'hard_locked'],
  active: ['expired'],
  expired: ['active'],
  hard_locked: ['active'],
};

export function canTransitionSubscription(current: SubscriptionState, next: SubscriptionState): boolean {
  return SUBSCRIPTION_TRANSITIONS[current]?.includes(next) ?? false;
}

// =============================================================================
// Subscription Service
// =============================================================================

export interface CreateSubscriptionInput {
  profile_id: string;
  plan: string;
  amount: number;
}

export const subscriptionService = {
  /**
   * Create a new subscription in TRIAL state
   * @witness [MON-001]
   */
  async createTrial(input: { profile_id: string }) {
    const now = new Date();
    const trialEnds = new Date(now.getTime() + TRIAL_DURATION_HOURS * 60 * 60 * 1000);

    // Create subscription record
    const subscription = await db
      .insertInto('subscriptions')
      .values({
        profile_id: input.profile_id,
        status: SUBSCRIPTION_STATUS.TRIAL,
        plan_name: SUBSCRIPTION_STATUS.TRIAL,
        amount: 0,
        activated_at: now,
        expires_at: trialEnds,
        current_period_start: now,
        current_period_end: trialEnds,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Update profile with trial status and credits
    await db
      .updateTable('profiles')
      .set({
        subscription_status: SUBSCRIPTION_STATUS.TRIAL,
        handshake_credits: MONTHLY_CREDITS,
        last_credit_reset_at: now,
        updated_at: now,
      })
      .where('id', '=', input.profile_id)
      .execute();

    return subscription;
  },

  /**
   * Activate subscription after successful payment
   * @witness [MON-001]
   */
  async activate(profileId: string, paymentId: string) {
    const profile = await db
      .selectFrom('profiles')
      .select(['subscription_status', 'handshake_credits'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const currentState = (profile.subscription_status ?? 'TRIAL') as SubscriptionState;

    if (!canTransitionSubscription(currentState, SUBSCRIPTION_STATUS.ACTIVE)) {
      throw new Error(`Cannot transition from ${currentState} to active`);
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Update subscription
    await db
      .updateTable('subscriptions')
      .set({
        status: SUBSCRIPTION_STATUS.ACTIVE,
        current_period_start: now,
        current_period_end: periodEnd,
        phonepe_transaction_id: paymentId,
        updated_at: now,
      })
      .where('profile_id', '=', profileId)
      .where('status', '=', currentState)
      .execute();

    // Update profile
    await db
      .updateTable('profiles')
      .set({
        subscription_status: SUBSCRIPTION_STATUS.ACTIVE,
        handshake_credits: MONTHLY_CREDITS,
        last_credit_reset_at: now,
        updated_at: now,
      })
      .where('id', '=', profileId)
      .execute();

    return { profile_id: profileId, status: SUBSCRIPTION_STATUS.ACTIVE, credits: MONTHLY_CREDITS };
  },

  /**
   * Expire subscription
   * @witness [MON-001]
   */
  async expire(profileId: string) {
    const profile = await db
      .selectFrom('profiles')
      .select('subscription_status')
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const currentState = profile.subscription_status as SubscriptionState;

    if (!canTransitionSubscription(currentState, SUBSCRIPTION_STATUS.EXPIRED)) {
      throw new Error(`Cannot transition from ${currentState} to expired`);
    }

    const now = new Date();

    await db
      .updateTable('subscriptions')
      .set({
        status: SUBSCRIPTION_STATUS.EXPIRED,
        updated_at: now,
      })
      .where('profile_id', '=', profileId)
      .where('status', '=', SUBSCRIPTION_STATUS.ACTIVE)
      .execute();

    await db
      .updateTable('profiles')
      .set({
        subscription_status: SUBSCRIPTION_STATUS.EXPIRED,
        updated_at: now,
      })
      .where('id', '=', profileId)
      .execute();

    return { profile_id: profileId, status: SUBSCRIPTION_STATUS.EXPIRED };
  },

  /**
   * Hard lock profile after trial expires without payment
   * @witness [MON-001]
   */
  async hardLock(profileId: string) {
    const profile = await db
      .selectFrom('profiles')
      .select('subscription_status')
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const currentState = profile.subscription_status as SubscriptionState;

    if (!canTransitionSubscription(currentState, SUBSCRIPTION_STATUS.HARD_LOCKED)) {
      throw new Error(`Cannot transition from ${currentState} to hard_locked`);
    }

    const now = new Date();

    await db
      .updateTable('subscriptions')
      .set({
        status: SUBSCRIPTION_STATUS.HARD_LOCKED,
        updated_at: now,
      })
      .where('profile_id', '=', profileId)
      .where('status', '=', SUBSCRIPTION_STATUS.TRIAL)
      .execute();

    await db
      .updateTable('profiles')
      .set({
        subscription_status: SUBSCRIPTION_STATUS.HARD_LOCKED,
        updated_at: now,
      })
      .where('id', '=', profileId)
      .execute();

    return { profile_id: profileId, status: SUBSCRIPTION_STATUS.HARD_LOCKED };
  },

  /**
   * Deduct handshake credits
   * Only on REQUESTED, never on ACCEPTED
   * @witness [MON-001]
   */
  async deductCredits(profileId: string) {
    const profile = await db
      .selectFrom('profiles')
      .select(['handshake_credits', 'subscription_status'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    if (profile.subscription_status === SUBSCRIPTION_STATUS.HARD_LOCKED) {
      throw new Error('Cannot initiate handshakes while hard locked');
    }

    const credits = profile.handshake_credits ?? 0;

    if (credits <= 0) {
      throw new Error('No handshake credits remaining');
    }

    const now = new Date();

    await db
      .updateTable('profiles')
      .set({
        handshake_credits: credits - 1,
        updated_at: now,
      })
      .where('id', '=', profileId)
      .execute();

    return { profile_id: profileId, remaining_credits: credits - 1 };
  },

  /**
   * Get rate limits and credits info
   * @witness [MON-001]
   */
  async getRateLimits(profileId: string) {
    const profile = await db
      .selectFrom('profiles')
      .select(['handshake_credits', 'credits_reset_at', 'subscription_status'])
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      handshake_credits: profile.handshake_credits ?? 0,
      monthly_limit: MONTHLY_CREDITS,
      reset_date: profile.credits_reset_at,
      subscription_status: profile.subscription_status,
    };
  },

  /**
   * Check and lock expired trials
   * Called by QStash scheduled job
   * @witness [MON-001]
   */
  async lockExpiredTrials() {
    const now = new Date();
    const lockThreshold = new Date(now.getTime() - TRIAL_LOCK_THRESHOLD_HOURS * 60 * 60 * 1000);

    const expiredTrials = await db
      .selectFrom('subscriptions')
      .select('profile_id')
      .where('status', '=', 'TRIAL')
      .where('trial_ends_at', '<', lockThreshold)
      .execute();

    for (const trial of expiredTrials) {
      try {
        await this.hardLock(trial.profile_id);
      } catch (error) {
        console.error(`Failed to lock trial for profile ${trial.profile_id}:`, error);
      }
    }

    return { locked_count: expiredTrials.length };
  },

  /**
   * Reset monthly credits for active subscriptions
   * Called by QStash scheduled job (monthly)
   * @witness [MON-001]
   */
  async resetMonthlyCredits() {
    const now = new Date();

    const result = await db
      .updateTable('profiles')
      .set({
        handshake_credits: MONTHLY_CREDITS,
        last_credit_reset_at: now,
        updated_at: now,
      })
      .where('subscription_status', '=', SUBSCRIPTION_STATUS.ACTIVE)
      .where((eb) =>
        eb.or([
          eb('last_credit_reset_at', 'is', null),
          eb('last_credit_reset_at', '<', now),
        ])
      )
      .execute();

    return { reset_count: result.length };
  },

  /**
   * Initiate a PhonePe payment for subscription upgrade
   * @witness [MON-001]
   */
  async initiateUpgrade(profileId: string, planName: string) {
    const profile = await db
      .selectFrom('profiles')
      .select('subscription_status')
      .where('id', '=', profileId)
      .executeTakeFirst();

    if (!profile) throw new Error('Profile not found');
    if (profile.subscription_status === 'ACTIVE') {
      throw new Error('Subscription already active');
    }

    // Generate transaction ID
    const merchantTxnId = `txn_${profileId}_${Date.now()}`;

    // Return payment initiation data (actual PhonePe integration in payments service)
    return {
      merchant_transaction_id: merchantTxnId,
      plan_name: planName,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/phonepe/callback?txn=${merchantTxnId}`,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  },
};