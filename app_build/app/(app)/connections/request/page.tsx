// @witness [HD-001]
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function HandshakeRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('target_id');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Failed to send handshake request');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Handshake Request</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="space-y-4 text-center py-4">
            <p className="text-4xl">🤝</p>
            <p className="font-medium">Handshake request sent!</p>
            <p className="text-sm text-muted-foreground">1 credit has been deducted from your account.</p>
            <Button onClick={() => router.back()}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>}
            <div>
              <label className="text-sm font-medium mb-1 block">Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={200}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Introduce yourself and explain why you'd like to connect..." />
              <p className="text-xs text-muted-foreground mt-1">{message.length}/200</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send Request (1 Credit)'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
