'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BlockedUser {
  id: string;
  name: string;
  blockedAt: string;
}

export default function PrivacyPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleDataExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/profiles/me/data-export', { credentials: 'include' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'buondesizn-data-export.json';
        a.click();
        window.URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Data export downloaded' });
      } else {
        setMessage({ type: 'error', text: 'Failed to export data' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error during export' });
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/profiles/me', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Account deletion request submitted' });
        setShowDeleteModal(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to submit deletion request' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleUnblock = async (userId: string) => {
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    setMessage({ type: 'success', text: 'User unblocked' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Privacy & Data</h1>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div className="pt-4 border-t border-border">
          <h2 className="font-semibold mb-2">Data Export</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Download a copy of all your data stored on BuonDesizn.
          </p>
          <Button onClick={handleDataExport} disabled={exporting} variant="outline">
            {exporting ? 'Exporting...' : 'Export My Data'}
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <h2 className="font-semibold mb-2 text-destructive">Delete Account</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Request permanent deletion of your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
            Request Account Deletion
          </Button>
        </div>

        <div className="pt-4 border-t border-border">
          <h2 className="font-semibold mb-4">Blocked Users</h2>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked users.</p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete your account and all associated data. Please confirm your reason for deletion.
            </p>
            <textarea
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion (optional)"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Confirm Deletion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
