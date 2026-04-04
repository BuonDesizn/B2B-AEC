// @witness [AD-001]
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', target_url: '', budget: '', duration_days: '30', geo_radius: '50' });

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/ads/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setForm({
            title: data.data.title || '',
            description: data.data.description || '',
            target_url: data.data.target_url || '',
            budget: data.data.budget?.toString() || '',
            duration_days: data.data.duration_days?.toString() || '30',
            geo_radius: data.data.geo_radius?.toString() || '50',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const handleSave = async () => {
    if (!resolvedParams) return;
    setSaving(true);
    await fetch(`/api/ads/${resolvedParams.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budget: parseFloat(form.budget), duration_days: parseInt(form.duration_days), geo_radius: parseInt(form.geo_radius) }),
    });
    setSaving(false);
    router.push('/ads');
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Edit Ad</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your advertising campaign</p>
        </div>
        <Link href="/ads"><Button variant="outline">Back to Ads</Button></Link>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Ad Title</label>
          <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Target URL</label>
          <input value={form.target_url} onChange={e => setForm(prev => ({ ...prev, target_url: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Budget (INR)</label>
            <input type="number" value={form.budget} onChange={e => setForm(prev => ({ ...prev, budget: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Duration (days)</label>
            <input type="number" value={form.duration_days} onChange={e => setForm(prev => ({ ...prev, duration_days: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Geo Radius (km)</label>
            <input type="number" value={form.geo_radius} onChange={e => setForm(prev => ({ ...prev, geo_radius: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          <Button variant="outline" onClick={() => router.push('/ads')}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
