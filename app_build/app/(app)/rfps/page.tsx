'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type RfpStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'EXPIRED';

interface Rfp {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  project_city: string;
  project_state: string;
  status: RfpStatus;
  responses_count: number;
  created_at: string;
  expiry_date: string | null;
}

const statusBadgeVariant = (status: RfpStatus) => {
  switch (status) {
    case 'OPEN':
      return 'default';
    case 'CLOSED':
      return 'secondary';
    case 'CANCELLED':
    case 'EXPIRED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function MyRFPsPage() {
  const router = useRouter();
  const [rfps, setRfps] = useState<Rfp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/rfps', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRfps(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? rfps.filter(r => r.status === statusFilter) : rfps;

  const handleAction = async (id: string, action: string) => {
    setActionLoading(`${id}-${action}`);
    try {
      await fetch(`/api/rfps/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const res = await fetch('/api/rfps', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setRfps(data.data);
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My RFPs</h1>
          <p className="text-sm text-muted-foreground">Manage your requests for proposals</p>
        </div>
        <Link href="/rfps/new">
          <Button>Create RFP</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No RFPs found</p>
          <Link href="/rfps/new">
            <Button className="mt-4">Create your first RFP</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rfp => (
            <div
              key={rfp.id}
              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/rfps/${rfp.id}`}
                    className="font-semibold hover:underline truncate block"
                  >
                    {rfp.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {rfp.category}
                    {rfp.subcategory ? ` · ${rfp.subcategory}` : ''} · {rfp.project_city}, {rfp.project_state}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rfp.responses_count || 0} response{rfp.responses_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={statusBadgeVariant(rfp.status) as any}>{rfp.status}</Badge>
                  {rfp.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      disabled={actionLoading === `${rfp.id}-publish`}
                      onClick={() => handleAction(rfp.id, 'publish')}
                    >
                      {actionLoading === `${rfp.id}-publish` ? '...' : 'Publish'}
                    </Button>
                  )}
                  {rfp.status === 'OPEN' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading === `${rfp.id}-close`}
                      onClick={() => handleAction(rfp.id, 'close')}
                    >
                      {actionLoading === `${rfp.id}-close` ? '...' : 'Close'}
                    </Button>
                  )}
                  {(rfp.status === 'DRAFT' || rfp.status === 'OPEN') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading === `${rfp.id}-cancel`}
                      onClick={() => handleAction(rfp.id, 'cancel')}
                    >
                      {actionLoading === `${rfp.id}-cancel` ? '...' : 'Cancel'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
