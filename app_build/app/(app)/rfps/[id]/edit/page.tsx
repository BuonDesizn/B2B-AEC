// @witness [RFP-001]
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'PROJECT', label: 'Project' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

export default function EditRFPPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', category: '', subcategory: '', budget_min: '', budget_max: '',
    project_city: '', project_state: '', project_address: '', description: '',
    requirements: '', expiry_date: '', estimated_duration_days: '',
  });

  useEffect(() => { params.then(p => setResolvedParams(p)); }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/rfps/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const rfp = data.data.rfp;
          setForm({
            title: rfp.title || '', category: rfp.category || '', subcategory: rfp.subcategory || '',
            budget_min: rfp.budget_min?.toString() || '', budget_max: rfp.budget_max?.toString() || '',
            project_city: rfp.project_city || '', project_state: rfp.project_state || '',
            project_address: rfp.project_address || '', description: rfp.description || '',
            requirements: rfp.requirements || '', expiry_date: rfp.expiry_date ? rfp.expiry_date.split('T')[0] : '',
            estimated_duration_days: rfp.estimated_duration_days?.toString() || '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!resolvedParams) return;
    setSubmitting(true);
    await fetch(`/api/rfps/${resolvedParams.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
      }),
    });
    setSubmitting(false);
    router.push(`/rfps/${resolvedParams.id}`);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Edit RFP</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your request for proposal</p>
        </div>
        <Link href={`/rfps/${resolvedParams?.id}`}><Button variant="outline">Back to RFP</Button></Link>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Title *</label>
          <Input value={form.title} onChange={e => update('title', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Category *</label>
            <select value={form.category} onChange={e => update('category', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Subcategory</label>
            <Input value={form.subcategory} onChange={e => update('subcategory', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Budget Min (INR)</label>
            <Input type="number" value={form.budget_min} onChange={e => update('budget_min', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Budget Max (INR)</label>
            <Input type="number" value={form.budget_max} onChange={e => update('budget_max', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">City</label>
            <Input value={form.project_city} onChange={e => update('project_city', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">State</label>
            <select value={form.project_state} onChange={e => update('project_state', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select state</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Requirements</label>
          <textarea value={form.requirements} onChange={e => update('requirements', e.target.value)} rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Expiry Date</label>
            <Input type="date" value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Estimated Duration (days)</label>
            <Input type="number" value={form.estimated_duration_days} onChange={e => update('estimated_duration_days', e.target.value)} placeholder="e.g., 90" />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}
