// @witness [MOD-001]
'use client';

export default function AuditPurgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Audit Purge Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage audit log retention and purging</p>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm font-medium text-amber-800">Warning</p>
          <p className="text-sm text-amber-700 mt-1">Purging audit logs is irreversible. Ensure compliance requirements are met before proceeding.</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Purge logs older than (days)</label>
            <input type="number" defaultValue={90} className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Entity Type</label>
            <select className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="connections">Connections</option>
              <option value="unmasking">Unmasking</option>
              <option value="moderation">Moderation</option>
            </select>
          </div>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
          Purge Audit Logs
        </button>
      </div>
    </div>
  );
}
