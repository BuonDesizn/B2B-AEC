// @witness [UI-001]
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalConnections } = await supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACCEPTED');

    const { data: roleCounts } = await supabase
      .from('profiles')
      .select('persona_type')
      .not('persona_type', 'is', null);

    const roleDistribution = (roleCounts || []).reduce((acc, row) => {
      const role = row.persona_type;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        total_profiles: totalProfiles || 0,
        total_connections: totalConnections || 0,
        role_distribution: roleDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch stats' } },
      { status: 500 }
    );
  }
}
