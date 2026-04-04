import { Receiver, Client } from '@upstash/qstash';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || '',
});

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || '',
});

/**
 * Verify QStash signature for incoming webhook requests.
 * Returns true if the signature is valid.
 */
export async function verifyQStashSignature(request: Request): Promise<boolean> {
  const signature = request.headers.get('upstash-signature');
  if (!signature) return false;

  try {
    const body = await request.clone().text();
    const isValid = await receiver.verify({
      body,
      signature,
    });
    return isValid;
  } catch {
    return false;
  }
}

/**
 * Schedule a job with QStash.
 */
export async function scheduleJob(url: string, body: any, cron?: string) {
  if (cron) {
    return await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_APP_URL}${url}`,
      body,
      cron,
    });
  }

  return await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}${url}`,
    body,
  });
}
