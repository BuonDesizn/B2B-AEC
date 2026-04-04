// @witness [AD-001]
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ModerationHistory {
  action: string;
  created_at: string;
  reason?: string;
}

interface Ad {
  title: string;
  creator_name?: string;
  created_at: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'EXPIRED';
  description?: string;
  budget?: number;
  impressions?: number;
  clicks?: number;
  spend?: number;
  moderation_history?: ModerationHistory[];
}

export default function AdminAdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/admin/ads/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setAd(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;
  if (!ad) return (
    <div className="text-center py-12">
      <p>Ad not found</p>
      <Link href="/admin/moderation">
        <Button className="mt-4">Back to Moderation</Button>
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/moderation" className="text-sm text-muted-foreground hover:text-foreground">← Back to Moderation</Link>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{ad.title}</h1>
            <p className="text-sm text-muted-foreground">Created by {ad.creator_name || 'Unknown'} · {new Date(ad.created_at).toLocaleDateString()}</p>
          </div>
          <Badge variant={ad.status === 'ACTIVE' ? 'default' : ad.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>{ad.status}</Badge>
        </div>
        {ad.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ad.description}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="font-medium">Budget</p><p className="text-muted-foreground">₹{ad.budget?.toLocaleString('en-IN') || 0}</p></div>
          <div><p className="font-medium">Impressions</p><p className="text-muted-foreground">{ad.impressions?.toLocaleString() || 0}</p></div>
          <div><p className="font-medium">Clicks</p><p className="text-muted-foreground">{ad.clicks?.toLocaleString() || 0}</p></div>
          <div><p className="font-medium">Spend</p><p className="text-muted-foreground">₹{ad.spend?.toLocaleString('en-IN') || 0}</p></div>
        </div>
        {ad.moderation_history && ad.moderation_history.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Moderation History</h2>
            <div className="space-y-2">
              {ad.moderation_history.map((h: ModerationHistory, i: number) => (
                <div key={i} className="p-3 bg-muted rounded-md text-sm">
                  <p className="font-medium">{h.action} · {new Date(h.created_at).toLocaleString()}</p>
                  <p className="text-muted-foreground">{h.reason || 'No reason provided'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
