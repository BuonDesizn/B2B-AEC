// @witness [ID-001]
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/admin/users/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setUser(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const handleSuspend = async () => {
    if (!resolvedParams) return;
    await fetch(`/api/admin/users/${resolvedParams.id}/suspend`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: suspendReason }),
    });
    router.push('/admin');
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;
  if (!user) return <div className="text-center py-12"><p>User not found</p><Link href="/admin"><Button className="mt-4">Back to Admin</Button></Link></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Back to Admin</Link>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{user.org_name || 'Unknown'}</h1>
            <p className="text-sm text-muted-foreground">{user.persona_type} · {user.city || 'Unknown'}</p>
          </div>
          <Badge variant={user.subscription_status === 'active' ? 'default' : user.subscription_status === 'trial' ? 'secondary' : 'destructive'}>
            {user.subscription_status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="font-medium">Email</p><p className="text-muted-foreground">{user.email || '-'}</p></div>
          <div><p className="font-medium">Phone</p><p className="text-muted-foreground">{user.phone_primary || '-'}</p></div>
          <div><p className="font-medium">PAN</p><p className="text-muted-foreground">{user.pan || '-'}</p></div>
          <div><p className="font-medium">GSTIN</p><p className="text-muted-foreground">{user.gstin || '-'}</p></div>
          <div><p className="font-medium">Verification</p><p className="text-muted-foreground">{user.verification_status}</p></div>
          <div><p className="font-medium">DQS Score</p><p className="text-muted-foreground">{user.dqs_score || '-'}</p></div>
          <div><p className="font-medium">Handshake Credits</p><p className="text-muted-foreground">{user.handshake_credits}</p></div>
          <div><p className="font-medium">Joined</p><p className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</p></div>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Suspend User</h2>
        <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Reason for suspension..." />
        <Button variant="destructive" onClick={handleSuspend}>Suspend User</Button>
      </div>
    </div>
  );
}
