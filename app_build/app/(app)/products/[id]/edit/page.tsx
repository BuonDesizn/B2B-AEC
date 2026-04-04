// @witness [PS-001]
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = ['Building Materials', 'Electrical', 'Plumbing', 'Finishes', 'Structural', 'HVAC', 'Safety', 'Tools', 'Other'];
const UNIT_OPTIONS = ['Nos', 'Sqft', 'Sqm', 'Kg', 'Ton', 'Ltr', 'Box', 'Set', 'Bag', 'Roll', 'Piece'];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', subcategory: '', description: '', price_per_unit: '', unit: 'Nos', min_order_quantity: '', specifications: '' });

  useEffect(() => { params.then(p => setResolvedParams(p)); }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/products/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const p = data.data;
          const specs = p.specifications ? JSON.stringify(p.specifications, null, 2) : '';
          setForm({ name: p.name || '', category: p.category || '', subcategory: p.subcategory || '', description: p.description || '', price_per_unit: p.price_per_unit?.toString() || '', unit: p.unit || 'Nos', min_order_quantity: p.min_order_quantity?.toString() || '', specifications: specs });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!resolvedParams) return;
    setSaving(true);
    const specsObj = form.specifications ? JSON.parse(form.specifications) : null;
    await fetch(`/api/products/${resolvedParams.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null, min_order_quantity: form.min_order_quantity ? parseInt(form.min_order_quantity) : null, specifications: specsObj }),
    });
    setSaving(false);
    router.push(`/products/${resolvedParams.id}`);
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Edit Product</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your product listing</p>
        </div>
        <Link href={`/products/${resolvedParams?.id}`}><Button variant="outline">Back to Product</Button></Link>
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Product Name *</label>
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
            <label className="text-sm font-medium mb-1 block">Subcategory</label>
            <Input value={form.subcategory} onChange={e => update('subcategory', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Price Per Unit (INR)</label>
            <Input type="number" value={form.price_per_unit} onChange={e => update('price_per_unit', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Unit</label>
            <select value={form.unit} onChange={e => update('unit', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Min Order Quantity</label>
            <Input type="number" value={form.min_order_quantity} onChange={e => update('min_order_quantity', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Specifications (JSON)</label>
          <textarea value={form.specifications} onChange={e => update('specifications', e.target.value)} rows={4} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none" placeholder='{"material": "Steel", "grade": "Fe500"}' />
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  );
}
