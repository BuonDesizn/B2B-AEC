// @witness [MOD-001]
'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ModerationAd {
  id: string;
  title: string;
  moderation_reason?: string;
  moderation_status: string;
}

export default function ModerationQueuePage() {
  const [queue, setQueue] = useState<ModerationAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/moderation/queue', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setQueue(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = async (adId: string, action: 'clear' | 'reject') => {
    setActionLoading(adId);
    try {
      await fetch(`/api/moderation/${adId}/${action}`, { method: 'POST', credentials: 'include' });
      setQueue(prev => prev.filter(q => q.id !== adId));
    } catch {}
    setActionLoading(null);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Moderation Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Flagged and suspended advertisements</p>
      </div>
      {queue.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No ads pending moderation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(ad => (
            <div key={ad.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{ad.title}</h3>
                  <p className="text-sm text-muted-foreground">Flagged: {ad.moderation_reason || 'Sightengine auto-flag'}</p>
                </div>
                <Badge variant="destructive">{ad.moderation_status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAction(ad.id, 'clear')} disabled={actionLoading === ad.id}>
                  {actionLoading === ad.id ? 'Processing...' : 'Clear'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleAction(ad.id, 'reject')} disabled={actionLoading === ad.id}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
