-- =============================================================================
-- Migration 016: Remove pg_cron DQS scheduling
-- =============================================================================
-- DQS recalculation is now triggered on-demand via QStash HTTP job
-- calling the API route /api/jobs/dqs-recalc instead of pg_cron.
-- =============================================================================

SELECT cron.unschedule('dqs-daily-recalc');
