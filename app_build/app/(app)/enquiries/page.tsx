'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'REQUESTED', label: 'New' },
  { value: 'RESPONDED', label: 'Responded' },
  { value: 'ACCEPTED', label: 'Accepted' },
];

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/connections', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setEnquiries(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch(`/api/connections/${id}/accept`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(prev =>
          prev.map(e => e.id === id ? { ...e, status: 'ACCEPTED' } : e)
        );
      }
    } catch (err) {
      console.error('Accept failed:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/connections/${id}/reject`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  const getSourceBadge = (source: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('product')) return { label: 'Product', variant: 'default' as const };
    if (s.includes('equipment')) return { label: 'Equipment', variant: 'secondary' as const };
    if (s.includes('ad')) return { label: 'Ad Click', variant: 'outline' as const };
    return { label: source || 'Search', variant: 'outline' as const };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return { label: 'New', variant: 'default' as const };
      case 'RESPONDED':
        return { label: 'Responded', variant: 'secondary' as const };
      case 'ACCEPTED':
        return { label: 'Accepted', variant: 'default' as const };
      case 'REJECTED':
        return { label: 'Rejected', variant: 'destructive' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const filtered = enquiries.filter(e => {
    const matchesSearch =
      e.source_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.message?.toLowerCase().includes(search.toLowerCase()) ||
      e.sender_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enquiries & Requests</h1>
        <p className="text-sm text-muted-foreground">
          Manage inbound enquiries from your connections
        </p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search enquiries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-card">
          <p className="text-lg text-muted-foreground">
            {search || statusFilter !== 'all' ? 'No enquiries match your filters' : 'No enquiries yet'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Enquiries will appear here when connections reach out about your products or equipment
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(enquiry => {
            const sourceBadge = getSourceBadge(enquiry.connection_source);
            const statusBadge = getStatusBadge(enquiry.status);
            return (
              <div key={enquiry.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">
                        {enquiry.sender_name || enquiry.profile_name || 'Unknown'}
                      </h3>
                      <Badge variant={sourceBadge.variant}>{sourceBadge.label}</Badge>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    </div>
                    {enquiry.source_name && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Re: {enquiry.source_name}
                      </p>
                    )}
                    {enquiry.message && (
                      <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                        {enquiry.message}
                      </p>
                    )}
                    {enquiry.created_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {enquiry.status === 'REQUESTED' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(enquiry.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(enquiry.id)}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {enquiry.status === 'ACCEPTED' && (
                      <Link href={`/connections/${enquiry.id}`}>
                        <Button size="sm" variant="outline">View Connection</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filtered.length} of {enquiries.length} enquir{enquiries.length !== 1 ? 'ies' : 'y'}
        </p>
      )}
    </div>
  );
}
