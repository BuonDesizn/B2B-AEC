// @witness [ID-001]
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/companies', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setCompanies(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search ? companies.filter(c => c.org_name?.toLowerCase().includes(search.toLowerCase()) || c.gstin?.includes(search)) : companies;

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Company Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse organizations and linked personnel</p>
      </div>
      <Input placeholder="Search by company name or GSTIN..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No companies found</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Company Name</th>
                <th className="text-left p-3 font-medium">GSTIN</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Personnel Count</th>
                <th className="text-left p-3 font-medium">Verification</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.gstin} className="border-t border-border">
                  <td className="p-3 font-medium">{c.org_name}</td>
                  <td className="p-3 font-mono text-xs">{c.gstin}</td>
                  <td className="p-3 hidden md:table-cell">{c.personnel_count || 0}</td>
                  <td className="p-3">{c.verification_status || 'Unverified'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
