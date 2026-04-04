// @witness [UI-001]
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/config', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setConfig(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">System Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage platform settings</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/config/dqs">
          <div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer">
            <h3 className="font-semibold">DQS Configuration</h3>
            <p className="text-sm text-muted-foreground mt-1">Discovery Quality Score weights and thresholds</p>
          </div>
        </Link>
        <Link href="/admin/config/plans">
          <div className="rounded-lg border bg-card p-6 hover:shadow-md cursor-pointer">
            <h3 className="font-semibold">Subscription Plans</h3>
            <p className="text-sm text-muted-foreground mt-1">Manage plan pricing and features</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
