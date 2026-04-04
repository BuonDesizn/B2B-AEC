// @witness [HD-001]
'use client';

import { useState, useEffect } from 'react';

interface UnmaskingLog {
  created_at: string;
  unmasker_id: string;
  target_id: string;
  mechanism: string;
  revealed_fields?: string[];
}

export default function UnmaskingAuditPage() {
  const [logs, setLogs] = useState<UnmaskingLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/audit/unmasking', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setLogs(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Unmasking Audit</h1>
        <p className="text-sm text-muted-foreground mt-1">PII unmasking event log</p>
      </div>
      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No unmasking events</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Timestamp</th>
                <th className="text-left p-3 font-medium">Unmasked By</th>
                <th className="text-left p-3 font-medium">Target</th>
                <th className="text-left p-3 font-medium">Mechanism</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Fields Revealed</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: UnmaskingLog, i: number) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-3">{log.unmasker_id?.slice(0, 8)}</td>
                  <td className="p-3">{log.target_id?.slice(0, 8)}</td>
                  <td className="p-3">{log.mechanism}</td>
                  <td className="p-3 hidden md:table-cell">{log.revealed_fields?.join(', ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
