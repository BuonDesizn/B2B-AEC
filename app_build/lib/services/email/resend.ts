// @witness [COM-001]
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailInput {
  to: string;
  subject: string;
  bodyHtml: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput) {
  const from = input.from ?? process.env.RESEND_FROM_EMAIL ?? 'noreply@buondesizn.com';

  const result = await resend.emails.send({
    from: `BuonDesizn <${from}>`,
    to: input.to,
    subject: input.subject,
    html: input.bodyHtml,
    replyTo: input.replyTo,
  });

  return result;
}

export async function sendBulkEmails(inputs: SendEmailInput[]) {
  const results = await Promise.allSettled(
    inputs.map((input) => sendEmail(input))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { succeeded, failed };
}
