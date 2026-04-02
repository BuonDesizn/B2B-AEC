# PhonePe Integration (Serverless)

Patterns for secure payment processing using PhonePe with Next.js and Supabase Edge Functions.

## Core Flow (Serverless Optimized)

1. **Initiation**: `POST /api/payment/initiate`
    - Construct payload with `merchantId`, `amount`, and `callbackUrl`.
    - Generate SHA256 checksum: `Base64(Payload) + "/pg/v1/pay" + SALT_KEY`.
    - Returns `redirectUrl` to client.
2. **Handoff**: Client redirects to PhonePe.
3. **Webhook**: PhonePe calls `POST /api/payment/webhook`.
    - **CRITICAL**: Verify `X-VERIFY` header before updating Supabase.
    - Checksum: `Base64(Response) + SALT_KEY`.
4. **Validation**: Server-side status check if webhook is delayed.

## Security Rules

- **Zero Client-Side Secrets**: Never expose `SALT_KEY` or `SALT_INDEX`.
- **Idempotency**: Use `merchantTransactionId` to prevent double-billing.
- **Environment Variables**:
    - `PHONEPE_MERCHANT_ID`
    - `PHONEPE_SALT_KEY`
    - `PHONEPE_SALT_INDEX`
    - `PHONEPE_HOST_URL`
    - `NEXT_PUBLIC_BASE_URL`


## Next.js 15+ Async Pattern
```typescript
// app/api/payment/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const xVerify = (await headers()).get('x-verify');
  
  // 1. Verify Checksum
  // 2. Update Supabase Transaction table
  // 3. Return 200 OK to PhonePe
}
```

## Error Handling
- **Timeout**: If Vercel function (10s limit) times out, use Supabase Edge Functions (up to 5 mins).
- **Fallback**: Always provide a "Check Status" button on the UI that triggers a server-side poll.
