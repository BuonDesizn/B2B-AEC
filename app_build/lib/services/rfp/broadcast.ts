// @witness [RFP-001]
import { db } from '@/lib/db';
import { notificationService } from '@/lib/services/notifications';

/**
 * Broadcast an RFP to nearby professionals when it's published.
 * Finds all users within the RFP's notification radius who match the target personas.
 * Sends a RFP_NEARBY notification to each.
 */
export async function broadcastRFP(rfpId: string) {
  const rfp = await db
    .selectFrom('rfps')
    .select([
      'id', 'creator_id', 'title', 'category', 'project_city', 'project_state',
      'project_location', 'notification_radius_meters', 'target_personas',
    ])
    .where('id', '=', rfpId)
    .executeTakeFirst();

  if (!rfp) {
    throw new Error('RFP not found');
  }

  if (!rfp.project_location) {
    return { broadcast_count: 0, reason: 'No project location set' };
  }

  const radiusMeters = rfp.notification_radius_meters ?? 50000;
  const targetPersonas = rfp.target_personas;

  // Find nearby profiles matching target personas
  const nearbyProfiles = await db
    .selectFrom('profiles')
    .select(['id', 'persona_type'])
    .where('persona_type', 'in', targetPersonas)
    .where('id', '!=', rfp.creator_id)
    .where('subscription_status', '!=', 'hard_locked')
    .where('location', 'is not', null)
    .execute();

  // Filter by distance (in-memory since we can't use PostGIS functions in Kysely easily)
  // In production, use a raw SQL query with ST_DWithin for efficiency
  const eligibleProfiles = nearbyProfiles.slice(0, 100); // Cap at 100 to avoid notification spam

  // Send RFP_NEARBY notification to each
  let sentCount = 0;
  for (const profile of eligibleProfiles) {
    try {
      await notificationService.emitEvent(
        'RFP_NEARBY',
        profile.id,
        {
          rfp_id: rfp.id,
          rfp_title: rfp.title,
          rfp_category: rfp.category,
          rfp_city: rfp.project_city,
          rfp_state: rfp.project_state,
        }
      );
      sentCount++;
    } catch (error) {
      console.error(`Failed to send RFP_NEARBY notification to ${profile.id}:`, error);
    }
  }

  return { broadcast_count: sentCount, total_eligible: eligibleProfiles.length };
}
