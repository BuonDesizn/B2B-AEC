# QStash Scheduled Jobs Configuration

## Setup

1. Go to [Upstash QStash Dashboard](https://console.upstash.io/qstash)
2. Select your project
3. Create the following scheduled jobs:

## Jobs to Create

### 1. DQS Recalculation (On-Demand)
- **URL**: `https://b2-b-aec.vercel.app/api/jobs/dqs-recalc`
- **Schedule**: Triggered on-demand via QStash dashboard or API (no fixed cron)
- **Method**: POST
- **Body**: `{}`
- **Retries**: 3
- **Timeout**: 300s
- **Purpose**: Recalculates Discovery Quality Score for all profiles
- **Note**: Previously ran daily via pg_cron; migrated to QStash on-demand trigger (see migration 016)

### 2. RFP Expiry Check (Hourly)
- **URL**: `https://b2-b-aec.vercel.app/api/jobs/rfp-expiry`
- **Schedule**: `0 * * * *` (Every hour)
- **Method**: POST
- **Body**: `{}`
- **Retries**: 3
- **Timeout**: 60s
- **Purpose**: Expires RFPs past their expiry date

### 3. Trial Lock Check (Hourly)
- **URL**: `https://b2-b-aec.vercel.app/api/jobs/trial-lock`
- **Schedule**: `0 * * * *` (Every hour)
- **Method**: POST
- **Body**: `{}`
- **Retries**: 3
- **Timeout**: 60s
- **Purpose**: Hard locks trials that expired > 49 hours ago

### 4. Monthly Credit Reset (Monthly)
- **URL**: `https://b2-b-aec.vercel.app/api/jobs/credit-reset`
- **Schedule**: `0 0 1 * *` (Midnight on 1st of each month)
- **Method**: POST
- **Body**: `{}`
- **Retries**: 3
- **Timeout**: 300s
- **Purpose**: Resets handshake credits to 30 for all active subscriptions

## Environment Variables Required

Ensure these are set in Vercel:
- `QSTASH_URL` - QStash endpoint
- `QSTASH_TOKEN` - QStash authentication token
- `QSTASH_CURRENT_SIGNING_KEY` - For verifying incoming requests
- `QSTASH_NEXT_SIGNING_KEY` - For key rotation
- `SUPABASE_DB_URL` - Database connection string
- `SIGHTENGINE_API_USER` - Content moderation API user
- `SIGHTENGINE_API_SECRET` - Content moderation API secret

## Monitoring

- Check job execution logs in QStash dashboard
- Monitor for failed executions and retry patterns
- Set up alerts for consecutive failures