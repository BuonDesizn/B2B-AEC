// @witness [MON-001]
import { NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';

const JOBS = [
  { name: 'RFP Expiry', description: 'Marks expired RFPs as EXPIRED', schedule: 'Every hour', status: 'Active' },
  { name: 'DQS Recalculation', description: 'Recalculates Discovery Quality Scores', schedule: 'Daily at 2 AM', status: 'Active' },
  { name: 'Credit Reset', description: 'Resets monthly handshake credits for subscribers', schedule: 'Monthly on 1st', status: 'Active' },
  { name: 'Trial Lock', description: 'Locks accounts after 48-hour trial expires', schedule: 'Every 6 hours', status: 'Active' },
  { name: 'Email Queue', description: 'Processes pending email notifications', schedule: 'Every 5 minutes', status: 'Active' },
];

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json({ success: true, data: JOBS });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch jobs' } }, { status: 500 });
  }
}
