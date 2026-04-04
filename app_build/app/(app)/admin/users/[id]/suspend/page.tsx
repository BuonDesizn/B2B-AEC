// @witness [ID-001]
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export default function SuspendUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'suspend' | 'reinstate'>('suspend');
  const [submitting, setSubmitting] = useState(false);

  if (!resolvedParams) {
    params.then(p => setResolvedParams(p));
    return <div className="h-48 bg-muted rounded animate-pulse" />;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    await fetch(`/api/admin/users/${resolvedParams.id}/${action}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    setSubmitting(false);
    router.push('/admin');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{action === 'suspend' ? 'Suspend' : 'Reinstate'} User</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage user access</p>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex gap-3">
          <button onClick={() => setAction('suspend')} className={`flex-1 py-2 rounded-md text-sm font-medium ${action === 'suspend' ? 'bg-red-600 text-white' : 'bg-muted'}`}>Suspend</button>
          <button onClick={() => setAction('reinstate')} className={`flex-1 py-2 rounded-md text-sm font-medium ${action === 'reinstate' ? 'bg-green-600 text-white' : 'bg-muted'}`}>Reinstate</button>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Reason</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Reason for this action..." />
        </div>
        <Button onClick={handleSubmit} disabled={submitting} variant={action === 'suspend' ? 'destructive' : 'default'}>{submitting ? 'Processing...' : action === 'suspend' ? 'Suspend User' : 'Reinstate User'}</Button>
      </div>
    </div>
  );
}
