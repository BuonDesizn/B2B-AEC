// @witness [RFP-001]
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function RFPResponseDetailPage({ params }: { params: Promise<{ id: string; responseId: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string; responseId: string } | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/rfps/${resolvedParams.id}/responses/${resolvedParams.responseId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setResponse(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const handleAction = async (action: string) => {
    if (!resolvedParams) return;
    setActionLoading(action);
    try {
      await fetch(`/api/rfps/${resolvedParams.id}/responses/${resolvedParams.responseId}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const res = await fetch(`/api/rfps/${resolvedParams.id}/responses/${resolvedParams.responseId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setResponse(data.data);
    } catch {}
    setActionLoading(null);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;
  if (!response) return <div className="text-center py-12"><p>Response not found</p><Link href="/rfps"><Button className="mt-4">Back to RFPs</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/rfps/${resolvedParams?.id}`} className="text-sm text-muted-foreground hover:text-foreground">← Back to RFP</Link>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{response.responder_name || 'Anonymous'}</h1>
            <p className="text-sm text-muted-foreground">{response.responder_persona || 'Unknown'} · Submitted {new Date(response.created_at).toLocaleDateString()}</p>
          </div>
          <Badge variant={response.status === 'ACCEPTED' ? 'default' : response.status === 'REJECTED' ? 'destructive' : 'outline'}>{response.status}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="font-medium">Estimated Cost</p><p className="text-muted-foreground">{response.estimated_cost ? `₹${response.estimated_cost.toLocaleString('en-IN')}` : 'Not specified'}</p></div>
          <div><p className="font-medium">Estimated Timeline</p><p className="text-muted-foreground">{response.estimated_days ? `${response.estimated_days} days` : 'Not specified'}</p></div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Proposal</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{response.proposal}</p>
        </div>
        {response.status === 'PENDING' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button size="sm" onClick={() => handleAction('shortlist')} disabled={actionLoading === 'shortlist'}>{actionLoading === 'shortlist' ? 'Processing...' : 'Shortlist'}</Button>
            <Button size="sm" onClick={() => handleAction('accept')} disabled={actionLoading === 'accept'}>{actionLoading === 'accept' ? 'Processing...' : 'Accept'}</Button>
            <Button variant="destructive" size="sm" onClick={() => handleAction('reject')} disabled={actionLoading === 'reject'}>{actionLoading === 'reject' ? 'Processing...' : 'Reject'}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
