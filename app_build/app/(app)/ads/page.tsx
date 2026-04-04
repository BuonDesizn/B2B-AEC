// @witness [AD-001]
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Ad {
  id: string;
  title: string;
  status: string;
  budget: number | null;
  impressions: number;
  clicks: number;
  moderation_status: string | null;
  created_at: string;
  end_date: string | null;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  EXPIRED: 'bg-gray-200 text-gray-900',
  SUSPENDED: 'bg-red-100 text-red-800',
};

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ads', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setAds(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleRetryPayment = async (id: string) => {
    try {
      const res = await fetch(`/api/ads/${id}/retry-payment`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      }
    } catch {}
  };

  const handleRefundRequest = async (id: string) => {
    await fetch(`/api/ads/${id}/refund-request`, { method: 'POST', credentials: 'include' });
    setAds(prev => prev.map(a => a.id === id ? { ...a, status: 'PENDING_REFUND' } : a));
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">My Ads</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your advertising campaigns</p>
        </div>
        <Link href="/ads/new"><Button>Create Ad</Button></Link>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No ads created yet</p>
          <Link href="/ads/new"><Button className="mt-4">Create Your First Ad</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div key={ad.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{ad.title}</h3>
                  <p className="text-xs text-muted-foreground">Created {new Date(ad.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[ad.status] || ''}>{ad.status}</Badge>
                  {ad.moderation_status && ad.moderation_status !== 'CLEARED' && (
                    <Badge variant="destructive">{ad.moderation_status}</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Impressions</p>
                  <p className="font-medium">{ad.impressions?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clicks</p>
                  <p className="font-medium">{ad.clicks?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="font-medium">{ad.budget ? `₹${ad.budget.toLocaleString('en-IN')}` : '-'}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Link href={`/ads/${ad.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full">Edit</Button></Link>
                {ad.status === 'PENDING_PAYMENT' && (
                  <Button size="sm" onClick={() => handleRetryPayment(ad.id)}>Retry Payment</Button>
                )}
                {ad.status === 'ACTIVE' && (
                  <Button variant="outline" size="sm" onClick={() => handleRefundRequest(ad.id)}>Request Refund</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
