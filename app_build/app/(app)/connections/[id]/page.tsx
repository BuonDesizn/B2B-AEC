'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConnectionDetail {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'BLOCKED';
  requester_name: string;
  requester_persona_type: string;
  requester_city: string;
  requester_message: string | null;
  phone: string | null;
  email: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  other_party_id: string;
}

interface TimelineEvent {
  date: string;
  label: string;
  description: string;
}

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  ACCEPTED: 'bg-green-500/10 text-green-600 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  EXPIRED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  BLOCKED: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function ConnectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [connection, setConnection] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockLoading, setBlockLoading] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/connections/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setConnection(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const handleBlock = async () => {
    if (!resolvedParams || !connection) return;
    setBlockLoading(true);
    try {
      const targetId = connection.requester_id === connection.target_id
        ? connection.target_id
        : connection.requester_id;
      const res = await fetch('/api/connections/block', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
      });
      const data = await res.json();
      if (data.success) {
        setConnection(prev => prev ? { ...prev, status: 'BLOCKED' } : null);
      }
    } catch {
    } finally {
      setBlockLoading(false);
    }
  };

  const buildTimeline = (conn: ConnectionDetail): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    events.push({
      date: conn.created_at,
      label: 'Connection Requested',
      description: conn.requester_message || 'Handshake request sent',
    });

    if (conn.status === 'ACCEPTED' && conn.accepted_at) {
      events.push({
        date: conn.accepted_at,
        label: 'Connection Accepted',
        description: 'Both parties are now connected',
      });
    }

    if (conn.status === 'REJECTED') {
      events.push({
        date: conn.updated_at,
        label: 'Connection Declined',
        description: 'The request was declined',
      });
    }

    if (conn.status === 'EXPIRED') {
      events.push({
        date: conn.updated_at,
        label: 'Connection Expired',
        description: 'Request expired after 30 days without response',
      });
    }

    if (conn.status === 'BLOCKED') {
      events.push({
        date: conn.updated_at,
        label: 'Connection Blocked',
        description: 'This connection has been blocked',
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Connection not found</p>
        <Link href="/address-book" className="inline-block mt-4">
          <Button size="sm">Back to Address Book</Button>
        </Link>
      </div>
    );
  }

  const timeline = buildTimeline(connection);
  const otherPartyId = connection.other_party_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/address-book" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Address Book
        </Link>
        {connection.status !== 'BLOCKED' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBlock}
            disabled={blockLoading}
          >
            {blockLoading ? 'Blocking...' : 'Block Connection'}
          </Button>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-[var(--font-playfair)]">
                {connection.requester_name || 'Professional'}
              </h1>
              <Badge className={statusColors[connection.status] || ''}>
                {connection.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {connection.requester_persona_type} · {connection.requester_city}
            </p>
          </div>
        </div>

        {connection.requester_message && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm italic text-muted-foreground">
              &quot;{connection.requester_message}&quot;
            </p>
          </div>
        )}

        {connection.status === 'ACCEPTED' && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold font-[var(--font-playfair)]">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {connection.phone ? (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="font-medium">{connection.phone}</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-muted-foreground italic">Not provided</p>
                </div>
              )}
              {connection.email ? (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{connection.email}</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-muted-foreground italic">Not provided</p>
                </div>
              )}
              {connection.linkedin_url ? (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                  <a
                    href={connection.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">LinkedIn</p>
                  <p className="text-muted-foreground italic">Not provided</p>
                </div>
              )}
            </div>
          </div>
        )}

        {connection.status !== 'ACCEPTED' && connection.status !== 'REQUESTED' && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              {connection.status === 'REJECTED' && 'This connection request was declined.'}
              {connection.status === 'EXPIRED' && 'This connection request expired after 30 days.'}
              {connection.status === 'BLOCKED' && 'This connection has been blocked.'}
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            Requested on {new Date(connection.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold font-[var(--font-playfair)] mb-4">Connection History</h2>
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                {index < timeline.length - 1 && (
                  <div className="w-px h-full bg-border mt-1" />
                )}
              </div>
              <div className="pb-4">
                <p className="font-medium text-sm">{event.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Link href={`/profiles/${otherPartyId}`}>
          <Button variant="outline" size="sm">View Full Profile</Button>
        </Link>
      </div>
    </div>
  );
}
