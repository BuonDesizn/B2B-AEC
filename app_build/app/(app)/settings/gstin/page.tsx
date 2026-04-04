// @witness [ID-001]
'use client';

import { useMemo, useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function GSTINChangePage() {
  const [currentGSTIN, setCurrentGSTIN] = useState('');
  const [newGSTIN, setNewGSTIN] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('gstin').eq('id', user.id).single();
      if (data) setCurrentGSTIN(data.gstin || '');
      setLoading(false);
    })();
  }, [supabase]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    if (!newGSTIN.trim() || newGSTIN.length !== 15) {
      setMessage({ type: 'error', text: 'Valid GSTIN is required (15 characters)' });
      setSubmitting(false);
      return;
    }
    try {
      const res = await fetch('/api/profiles/gstin-change-request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_gstin: newGSTIN, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'GSTIN change request submitted for admin review' });
        setNewGSTIN('');
        setReason('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit request' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">GSTIN Change Request</h1>
        <p className="text-sm text-muted-foreground mt-1">Request a change to your registered GSTIN</p>
      </div>
      {message && <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message.text}</div>}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Current GSTIN</label>
          <Input value={currentGSTIN} disabled className="bg-muted" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">New GSTIN *</label>
          <Input value={newGSTIN} onChange={e => setNewGSTIN(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" maxLength={15} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Reason for Change *</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="Explain why you need to change your GSTIN..." />
        </div>
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Change Request'}</Button>
      </div>
    </div>
  );
}
