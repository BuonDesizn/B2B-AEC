'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl?: string;
}

export default function BillingPage() {
  const [billingData, setBillingData] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile/rate-limits', { credentials: 'include' }).then(res => res.json()),
      fetch('/api/subscriptions/invoices', { credentials: 'include' }).then(res => res.json()),
    ])
      .then(([planRes, invRes]) => {
        if (planRes.success) setBillingData(planRes.data);
        if (invRes.success) setInvoices(invRes.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const status = billingData?.subscription_status || 'trial';
  const monthlyReset = billingData?.monthly_reset_date;

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    trial: { label: 'Trial', variant: 'secondary' },
    active: { label: 'Active', variant: 'default' },
    expired: { label: 'Expired', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
  };

  const currentStatus = statusConfig[status] || statusConfig.trial;

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Billing & Invoices</h1>

      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold font-[var(--font-playfair)]">Subscription Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="font-medium">
              {status === 'trial' ? '48-Hour Free Trial' : status === 'active' ? 'National Pro' : 'No Active Plan'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Next Billing Date</p>
            <p className="font-medium">
              {monthlyReset
                ? new Date(monthlyReset).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold font-[var(--font-playfair)] mb-4">Payment History</h2>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-3xl mb-2">📄</p>
            <p>No payment history yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-2">
                      {new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-2">{inv.description}</td>
                    <td className="py-3 px-2 font-medium">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'default'
                            : inv.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      {inv.downloadUrl ? (
                        <a
                          href={inv.downloadUrl}
                          className="text-primary hover:underline text-sm"
                          download
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
