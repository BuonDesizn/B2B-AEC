'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Connection {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_persona_type: string;
  requester_city: string;
  requester_message: string | null;
  expires_at: string;
  created_at: string;
}

export default function IncomingConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/connections?status=REQUESTED&direction=incoming', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setConnections(data.data.items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000));
  };

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    setActionLoading(id);
    const prevConnections = [...connections];
    setConnections(prev => prev.filter(c => c.id !== id));
    try {
      const res = await fetch(`/api/connections/${id}/${action}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) {
        setConnections(prevConnections);
      } else if (action === 'accept') {
        router.push('/address-book');
      }
    } catch {
      setConnections(prevConnections);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Incoming Handshakes</h1>
          <p className="text-muted-foreground mt-1">Review and respond to connection requests</p>
        </div>
        <Link href="/connections/outgoing">
          <Button variant="outline" size="sm">View Outgoing</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border border-border">
          <p className="text-4xl mb-3">🤝</p>
          <p className="text-lg font-medium">No incoming handshake requests</p>
          <p className="text-sm mt-1">When someone sends you a request, it will appear here</p>
          <Link href="/discover" className="inline-block mt-4">
            <Button size="sm">Discover Professionals</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map(conn => {
            const daysLeft = getDaysUntilExpiry(conn.expires_at);
            const isExpiringSoon = daysLeft <= 7;

            return (
              <div key={conn.id} className="p-5 rounded-lg border border-border bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{conn.requester_name || 'Professional'}</h3>
                      <Badge variant="outline">{conn.requester_persona_type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{conn.requester_city}</p>
                    {conn.requester_message && (
                      <p className="text-sm mt-3 italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                        &quot;{conn.requester_message}&quot;
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <p className={`text-xs ${isExpiringSoon ? 'text-amber-500 font-medium' : 'text-muted-foreground'}`}>
                        {isExpiringSoon ? '⚠️' : '⏳'} Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {new Date(conn.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAction(conn.id, 'accept')}
                      disabled={actionLoading === conn.id}
                    >
                      {actionLoading === conn.id ? 'Processing...' : 'Accept'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(conn.id, 'reject')}
                      disabled={actionLoading === conn.id}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
