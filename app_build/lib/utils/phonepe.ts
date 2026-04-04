// @witness [MON-001]
import crypto from 'crypto';

const PHONEPE_BASE_URLS = {
  UAT: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  PROD: 'https://api.phonepe.com/apis/hermes',
};

export function getPhonePeBaseUrl(): string {
  const env = process.env.PHONEPE_ENVIRONMENT || 'UAT';
  return PHONEPE_BASE_URLS[env as keyof typeof PHONEPE_BASE_URLS] || PHONEPE_BASE_URLS.UAT;
}

export function generateChecksum(payload: string, salt: string, saltIndex: string): string {
  const base64Payload = Buffer.from(payload).toString('base64');
  const hash = crypto
    .createHash('sha256')
    .update(base64Payload + salt + saltIndex)
    .digest('hex');
  return `${hash}###${saltIndex}`;
}

export function verifyCallbackSignature(payload: string, signature: string, salt: string): boolean {
  const base64Payload = Buffer.from(payload).toString('base64');
  const expectedHash = crypto
    .createHash('sha256')
    .update(base64Payload + salt)
    .digest('hex');
  return signature === expectedHash;
}

export interface PhonePePaymentPayload {
  merchantId: string;
  merchantTransactionId: string;
  merchantOrderId: string;
  amount: number;
  redirectUrl: string;
  redirectMode: string;
  callbackUrl: string;
  paymentInstrument: {
    type: string;
  };
}

export function buildPaymentPayload(
  merchantId: string,
  transactionId: string,
  amount: number,
  redirectUrl: string
): PhonePePaymentPayload {
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/phonepe/callback`;

  return {
    merchantId,
    merchantTransactionId: transactionId,
    merchantOrderId: transactionId,
    amount,
    redirectUrl,
    redirectMode: 'REDIRECT',
    callbackUrl,
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };
}
