// @witness [UI-001]
'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  'Earthmoving', 'Lifting', 'Concrete', 'Road Construction', 'Generator',
  'Compressor', 'Compaction', 'Drilling', 'Scaffolding', 'Other',
];

export default function AddEditEquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const equipmentId = searchParams.get('id');
  const isEditing = !!equipmentId;

  const [fetching, setFetching] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: '',
    type: '',
    description: '',
    daily_rate: '',
    weekly_rate: '',
    monthly_rate: '',
    location: '',
    operator_included: 'N',
    available: 'Y',
    features: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (isEditing && equipmentId) {
      fetch(`/api/equipment/${equipmentId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
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
              operator_included: e.operator_included ? 'Y' : 'N',
              available: e.available ? 'Y' : 'N',
              features: e.features?.join(', ') || '',
            });
          }
          setFetching(false);
        })
        .catch(() => setFetching(false));
    }
  }, [isEditing, equipmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const featuresArr = form.features.split(',').map(f => f.trim()).filter(Boolean);

    const payload = {
      name: form.name,
      category: form.category,
      type: form.type || null,
      description: form.description || null,
      daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null,
      weekly_rate: form.weekly_rate ? parseFloat(form.weekly_rate) : null,
      monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
      location: form.location || null,
      operator_included: form.operator_included === 'Y',
      available: form.available === 'Y',
      features: featuresArr,
    };

    try {
      const url = isEditing ? `/api/equipment/${equipmentId}` : '/api/equipment';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/equipment');
        router.refresh();
      } else {
        alert(data.error || 'Failed to save equipment');
      }
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return <div className="space-y-6"><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-64 bg-muted rounded animate-pulse" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{isEditing ? 'Edit Equipment' : 'Add Equipment'}</h1>
          <p className="text-sm text-muted-foreground mt-1">List your equipment for rent or sale</p>
        </div>
        <Link href="/equipment"><Button variant="outline">Back to Equipment</Button></Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Equipment Name *</label>
          <Input value={form.name} onChange={e => updateField('name', e.target.value)} required placeholder="e.g., CAT 320 Excavator" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Category *</label>
            <select value={form.category} onChange={e => updateField('category', e.target.value)} required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Input value={form.type} onChange={e => updateField('type', e.target.value)} placeholder="e.g., Hydraulic Excavator" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the equipment condition, capacity, etc." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Daily Rate (INR)</label>
            <Input type="number" value={form.daily_rate} onChange={e => updateField('daily_rate', e.target.value)} placeholder="15000" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Weekly Rate (INR)</label>
            <Input type="number" value={form.weekly_rate} onChange={e => updateField('weekly_rate', e.target.value)} placeholder="75000" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Monthly Rate (INR)</label>
            <Input type="number" value={form.monthly_rate} onChange={e => updateField('monthly_rate', e.target.value)} placeholder="250000" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Current Location</label>
          <Input value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="e.g., Mumbai, Maharashtra" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Operator Included</label>
            <div className="flex gap-3 mt-1">
              <label className="flex items-center gap-1"><input type="radio" name="operator_included" value="Y" checked={form.operator_included === 'Y'} onChange={e => updateField('operator_included', e.target.value)} /> Yes</label>
              <label className="flex items-center gap-1"><input type="radio" name="operator_included" value="N" checked={form.operator_included === 'N'} onChange={e => updateField('operator_included', e.target.value)} /> No</label>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Available</label>
            <div className="flex gap-3 mt-1">
              <label className="flex items-center gap-1"><input type="radio" name="available" value="Y" checked={form.available === 'Y'} onChange={e => updateField('available', e.target.value)} /> Yes</label>
              <label className="flex items-center gap-1"><input type="radio" name="available" value="N" checked={form.available === 'N'} onChange={e => updateField('available', e.target.value)} /> No</label>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Features (comma separated)</label>
          <Input value={form.features} onChange={e => updateField('features', e.target.value)} placeholder="GPS, AC Cabin, Hydraulic System" />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEditing ? 'Update Equipment' : 'Add Equipment'}</Button>
          <Link href="/equipment"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
