// @witness [ID-001]
'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface IdentityRequest {
  id: string;
  org_name?: string;
  pan?: string;
  gstin?: string;
  persona_type: string;
}

export default function IdentityReviewPage() {
  const [queue, setQueue] = useState<IdentityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/identity/pending', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setQueue(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/gstin-change-requests/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setQueue(prev => prev.filter(q => q.id !== id));
    } catch {}
    setActionLoading(null);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Identity Review Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Pending GSTIN/PAN verifications</p>
      </div>
      {queue.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No pending verifications</p>
          <p className="text-sm mt-1">All identities have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(item => (
            <div key={item.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{item.org_name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">PAN: {item.pan || 'N/A'} · GSTIN: {item.gstin || 'N/A'}</p>
                </div>
                <Badge variant="outline">{item.persona_type}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAction(item.id, 'approve')} disabled={actionLoading === item.id}>
                  {actionLoading === item.id ? 'Processing...' : 'Approve'}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleAction(item.id, 'reject')} disabled={actionLoading === item.id}>
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
