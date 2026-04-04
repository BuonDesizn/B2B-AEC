// @witness [ID-001]
'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Personnel {
  id: string;
  full_name: string;
  designation: string;
  qualification: string | null;
  specialty: string | null;
  years_experience: number | null;
  is_active: boolean;
}

export default function MyTeamPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', designation: '', qualification: '', specialty: '', years_experience: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/company-personnel', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setPersonnel(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/company-personnel', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, years_experience: form.years_experience ? parseInt(form.years_experience) : null }),
      });
      const data = await res.json();
      if (data.success) {
        setPersonnel(prev => [...prev, data.data]);
        setShowForm(false);
        setForm({ full_name: '', designation: '', qualification: '', specialty: '', years_experience: '' });
      }
    } catch {
    }
    setSubmitting(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/company-personnel/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    });
    setPersonnel(prev => prev.map(p => p.id === id ? { ...p, is_active: !isActive } : p));
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">My Team</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your company personnel</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Personnel'}</Button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Team Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name *</label>
              <Input value={form.full_name} onChange={e => setForm(prev => ({ ...prev, full_name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Designation</label>
              <Input value={form.designation} onChange={e => setForm(prev => ({ ...prev, designation: e.target.value }))} placeholder="Senior Engineer" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Qualification</label>
              <Input value={form.qualification} onChange={e => setForm(prev => ({ ...prev, qualification: e.target.value }))} placeholder="B.Arch, M.Tech" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Specialty</label>
              <Input value={form.specialty} onChange={e => setForm(prev => ({ ...prev, specialty: e.target.value }))} placeholder="Structural Design" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Years of Experience</label>
              <Input type="number" value={form.years_experience} onChange={e => setForm(prev => ({ ...prev, years_experience: e.target.value }))} placeholder="10" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={submitting || !form.full_name}>{submitting ? 'Adding...' : 'Add Member'}</Button>
        </div>
      )}

      {personnel.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No team members yet</p>
          <p className="text-sm mt-1">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Designation</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Qualification</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Specialty</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Experience</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {personnel.map(p => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-medium">{p.full_name}</td>
                  <td className="p-3">{p.designation}</td>
                  <td className="p-3 hidden md:table-cell">{p.qualification || '-'}</td>
                  <td className="p-3 hidden lg:table-cell">{p.specialty || '-'}</td>
                  <td className="p-3 hidden md:table-cell">{p.years_experience ?? '-'} yrs</td>
                  <td className="p-3"><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" onClick={() => handleToggle(p.id, p.is_active)}>
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
