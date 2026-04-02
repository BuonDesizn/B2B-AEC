---
name: sightengine-moderation
description: Best practices for Sightengine API integration on BuonDesizn. Exclusively details the implementation of security_metadata logging in Postgres.
---

# Sightengine Moderation Standards

## Core Requirement
BuonDesizn uses **Sightengine exclusively** for media and text moderation to ensure platform safety. We do not use Google Cloud Vision, AWS Rekognition, or custom NLP pipelines. 

## Integration Workflow
1. **Async Webhooks**: Do NOT block uploads synchronously via the UI.
   - User uploads media to a Supabase Storage bucket.
   - A Supabase Edge Function (or Database Trigger) observes the upload.
   - The function generates a signed URL and POSTs it asynchronously to Sightengine.
2. **Text Moderation in Chat**: Chat messages are passed to Sightengine via the text moderation endpoints.

## Data Schema Expectation
Every chat message or moderated image must log the Sightengine response locally in the database.
You must insert the Sightengine response payload directly into the `security_metadata` JSONB column found on tables like `chat_messages` or `portfolio_items`.

### Example `security_metadata` Payload
```json
{
  "sightengine_id": "req_xyz123",
  "status": "success",
  "profanity": { "matches": [] },
  "nudity": { "safe": 0.99, "partial": 0.01 },
  "action_taken": "APPROVED"
}
```

## Failure Scenarios
If Sightengine flags content (e.g., explicit language or inappropriate images):
1. **Mask the UI**: The frontend must hide the content and display a "Pending Review" or "Content Hidden" tombstone.
2. **Auto-Report**: The webhook must automatically create a record in the `reports` table for `admin-operations-specialist` review.
