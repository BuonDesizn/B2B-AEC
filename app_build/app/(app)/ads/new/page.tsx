// @witness [AD-001]
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    target_url: '',
    budget: '',
    duration_days: '30',
    geo_radius: '50',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    if (!form.title || !form.budget) {
      setError('Title and budget are required');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: parseFloat(form.budget), duration_days: parseInt(form.duration_days), geo_radius: parseInt(form.geo_radius) }),
      });
      const data = await res.json();
      if (data.success && data.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else if (data.success) {
        router.push('/ads');
      } else {
        setError(data.error || 'Failed to create ad');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Create Ad</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your advertising campaign</p>
        </div>
        <Link href="/ads"><Button variant="outline">Back to Ads</Button></Link>
      </div>

      {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>}

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Ad Title *</label>
          <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g., Premium Steel Reinforcement" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe your ad content..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Target URL</label>
          <Input value={form.target_url} onChange={e => update('target_url', e.target.value)} placeholder="https://yourproduct.com" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Budget (INR) *</label>
            <Input type="number" value={form.budget} onChange={e => update('budget', e.target.value)} placeholder="5000" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Duration (days)</label>
            <Input type="number" value={form.duration_days} onChange={e => update('duration_days', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Geo Radius (km)</label>
            <Input type="number" value={form.geo_radius} onChange={e => update('geo_radius', e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Processing...' : 'Create & Pay'}</Button>
      </div>
    </div>
  );
}
