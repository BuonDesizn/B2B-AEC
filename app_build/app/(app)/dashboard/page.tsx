// @witness [UI-001]
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface MetricCard {
  label: string;
  value: number;
  href: string;
}

interface DashboardMetrics {
  metric1: MetricCard;
  metric2: MetricCard;
  metric3: MetricCard;
  metric4: MetricCard;
  subscription_status: string;
  handshake_credits: number;
  trial_ends_at: string | null;
  persona_type: string;
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="h-16 bg-muted rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded animate-pulse" />
        ))}
      </div>
      <div className="h-20 bg-muted rounded animate-pulse" />
      <div className="h-32 bg-muted rounded animate-pulse" />
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/metrics', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setMetrics(data.data);
        else setError(data.error?.message || 'Failed to load dashboard');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load dashboard');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!metrics) return null;

  const trialEndsAt = metrics.trial_ends_at ? new Date(metrics.trial_ends_at) : null;
  const trialHoursLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 3600000)) : null;

  const metricCards = [metrics.metric1, metrics.metric2, metrics.metric3, metrics.metric4];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Dashboard</h1>

      {metrics.subscription_status === 'trial' && trialHoursLeft !== null && (
        <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trial expires in {trialHoursLeft} hours</p>
              <p className="text-sm">Upgrade to National Pro to keep accessing all features</p>
            </div>
            <Link href="/plan">
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700">Upgrade Now</button>
            </Link>
          </div>
        </div>
      )}

      {metrics.subscription_status === 'hard_locked' && (
        <div className="p-6 rounded-lg border border-red-200 bg-red-50 text-red-800 text-center">
          <p className="text-lg font-medium">Your trial has ended</p>
          <p className="text-sm mt-1">Upgrade to National Pro to restore access</p>
          <Link href="/plan">
            <button className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Upgrade to National Pro</button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, i) => (
          <Link key={i} href={metric.href} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-3xl font-bold font-[var(--font-playfair)] mt-1">{metric.value}</p>
          </Link>
        ))}
      </div>

      <div className="p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Handshake Credits</p>
            <p className="text-2xl font-bold font-[var(--font-playfair)]">{metrics.handshake_credits} / 30</p>
          </div>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(metrics.handshake_credits / 30) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border bg-card">
        <h2 className="font-semibold font-[var(--font-playfair)] mb-3">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">Activity feed coming soon</p>
      </div>
    </div>
  );
}
