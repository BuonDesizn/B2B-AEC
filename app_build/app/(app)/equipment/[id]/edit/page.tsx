// @witness [ED-001]
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = ['Earthmoving', 'Lifting', 'Concrete', 'Road Construction', 'Generator', 'Compressor', 'Compaction', 'Drilling', 'Scaffolding', 'Other'];

export default function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', type: '', description: '', daily_rate: '', weekly_rate: '', monthly_rate: '', location: '', operator_included: false, features: '' });

  useEffect(() => { params.then(p => setResolvedParams(p)); }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/equipment/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const e = data.data;
          setForm({
            name: e.name || '',
            category: e.category || '',
            type: e.type || '',
            description: e.description || '',
            daily_rate: e.daily_rate?.toString() || '',
            weekly_rate: e.weekly_rate?.toString() || '',
            monthly_rate: e.monthly_rate?.toString() || '',
            location: e.location || '',
            operator_included: e.operator_included || false,
            features: e.features?.join(', ') || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const update = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!resolvedParams) return;
    setSaving(true);
    const featuresArr = form.features.split(',').map(f => f.trim()).filter(Boolean);
    await fetch(`/api/equipment/${resolvedParams.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null,
        weekly_rate: form.weekly_rate ? parseFloat(form.weekly_rate) : null,
        monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
        features: featuresArr,
      }),
    });
    setSaving(false);
    router.push(`/equipment/${resolvedParams.id}`);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Edit Equipment</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your equipment listing</p>
        </div>
        <Link href={`/equipment/${resolvedParams?.id}`}><Button variant="outline">Back to Equipment</Button></Link>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Equipment Name *</label>
          <Input value={form.name} onChange={e => update('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Input value={form.type} onChange={e => update('type', e.target.value)} placeholder="e.g., Excavator, Crane" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Daily Rate (INR)</label>
            <Input type="number" value={form.daily_rate} onChange={e => update('daily_rate', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Weekly Rate (INR)</label>
            <Input type="number" value={form.weekly_rate} onChange={e => update('weekly_rate', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Monthly Rate (INR)</label>
            <Input type="number" value={form.monthly_rate} onChange={e => update('monthly_rate', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Location</label>
          <Input value={form.location} onChange={e => update('location', e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.operator_included} onChange={e => update('operator_included', e.target.checked)} id="operator" />
          <label htmlFor="operator" className="text-sm">Operator Included</label>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Features (comma separated)</label>
          <Input value={form.features} onChange={e => update('features', e.target.value)} placeholder="GPS, AC Cabin, Hydraulic" />
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}
