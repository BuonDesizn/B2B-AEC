// @witness [MOD-001]
'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  created_at: string;
  entity_type?: string;
  action: string;
  user_id?: string;
  details?: Record<string, any>;
}

export default function AuditExplorerPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/admin/audit', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setLogs(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter ? logs.filter(l => l.entity_type?.toLowerCase().includes(filter.toLowerCase()) || l.action?.toLowerCase().includes(filter.toLowerCase())) : logs;

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Audit Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">Full system audit log</p>
      </div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by entity type or action..."
        className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm" />
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No audit logs found</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Timestamp</th>
                <th className="text-left p-3 font-medium">Entity</th>
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log: AuditLog, i: number) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-3">{log.entity_type || '-'}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3">{log.user_id?.slice(0, 8) || '-'}</td>
                  <td className="p-3 hidden lg:table-cell text-xs font-mono">{log.details ? JSON.stringify(log.details).slice(0, 100) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
