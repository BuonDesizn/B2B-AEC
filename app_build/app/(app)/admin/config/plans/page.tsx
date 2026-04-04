// @witness [MON-001]
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function PlansConfigPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/config/plans', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setPlans(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage plan pricing and features</p>
      </div>
      {plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No plans configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan: any) => (
            <div key={plan.id} className="rounded-lg border bg-card p-6 space-y-3">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <p className="text-2xl font-bold">₹{plan.price_monthly?.toLocaleString('en-IN')}/mo</p>
              <div className="space-y-1 text-sm">
                <p>Handshake Credits: {plan.handshake_credits}</p>
                <p>Max RFPs: {plan.max_rfps || 'Unlimited'}</p>
                <p>Max Ads: {plan.max_ads || 'Unlimited'}</p>
              </div>
              <Button variant="outline" size="sm">Edit Plan</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
