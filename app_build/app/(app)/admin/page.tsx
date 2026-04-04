// @witness [MOD-001]
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setStats(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  const cards = [
    { label: 'Total Users', value: stats?.total_users || 0, color: 'bg-[#E7D9F5] text-[#6415A5]' },
    { label: 'Trial Users', value: stats?.trial_users || 0, color: 'bg-amber-100 text-amber-800' },
    { label: 'Hard Locked', value: stats?.hard_locked || 0, color: 'bg-red-100 text-red-800' },
    { label: "Today's Handshakes", value: stats?.today_handshakes || 0, color: 'bg-green-100 text-green-800' },
    { label: 'Open RFPs', value: stats?.open_rfps || 0, color: 'bg-[#D9E4F5] text-[#1C4E8A]' },
    { label: 'Active Ads', value: stats?.active_ads || 0, color: 'bg-[#F7E9C1] text-[#8B5D14]' },
    { label: 'Pending Verifications', value: stats?.pending_verifications || 0, color: 'bg-amber-100 text-amber-800' },
    { label: 'Flagged Ads', value: stats?.flagged_ads || 0, color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and metrics</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-lg p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/identity"><div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer"><h3 className="font-semibold">Identity Review Queue</h3><p className="text-sm text-muted-foreground mt-1">Review pending GSTIN/PAN verifications</p></div></Link>
        <Link href="/admin/moderation"><div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer"><h3 className="font-semibold">Moderation Queue</h3><p className="text-sm text-muted-foreground mt-1">Review flagged advertisements</p></div></Link>
        <Link href="/admin/companies"><div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer"><h3 className="font-semibold">Company Explorer</h3><p className="text-sm text-muted-foreground mt-1">Browse organizations and personnel</p></div></Link>
        <Link href="/admin/audit"><div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer"><h3 className="font-semibold">Audit Explorer</h3><p className="text-sm text-muted-foreground mt-1">Full system audit log</p></div></Link>
        <Link href="/admin/config"><div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer"><h3 className="font-semibold">System Config</h3><p className="text-sm text-muted-foreground mt-1">Manage platform settings</p></div></Link>
        <Link href="/admin/jobs"><div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer"><h3 className="font-semibold">Background Jobs</h3><p className="text-sm text-muted-foreground mt-1">Monitor scheduled tasks</p></div></Link>
      </div>
    </div>
  );
}
