// @witness [MOD-001]
'use client';

import { useState, useEffect } from 'react';

export default function ModerationHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/moderation/history', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setHistory(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Moderation History</h1>
        <p className="text-sm text-muted-foreground mt-1">Past moderation actions</p>
      </div>
      {history.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No moderation history</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Ad</th>
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">Admin</th>
                <th className="text-left p-3 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any, i: number) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3">{new Date(h.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{h.ad_title}</td>
                  <td className="p-3">{h.action}</td>
                  <td className="p-3">{h.admin_name}</td>
                  <td className="p-3">{h.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
