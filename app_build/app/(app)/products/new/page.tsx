// @witness [UI-001]
'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  'Building Materials', 'Electrical', 'Plumbing', 'Finishes', 'Structural',
  'HVAC', 'Safety', 'Tools', 'Other',
];

const UNIT_OPTIONS = ['Nos', 'Sqft', 'Sqm', 'Kg', 'Ton', 'Ltr', 'Box', 'Set', 'Bag', 'Roll', 'Piece'];

export default function AddEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const isEditing = !!productId;

  const [fetching, setFetching] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: '',
    subcategory: '',
    description: '',
    price_per_unit: '',
    unit: 'Nos',
    min_order_quantity: '',
    available: 'Y',
    specifications: '',
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (isEditing && productId) {
      fetch(`/api/products/${productId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const p = data.data;
            setForm({
              name: p.name || '',
              category: p.category || '',
              subcategory: p.subcategory || '',
              description: p.description || '',
              price_per_unit: p.price_per_unit?.toString() || '',
              unit: p.unit || 'Nos',
              min_order_quantity: p.min_order_quantity?.toString() || '',
              available: p.available ? 'Y' : 'N',
              specifications: p.specifications ? JSON.stringify(p.specifications, null, 2) : '',
            });
          }
          setFetching(false);
        })
        .catch(() => setFetching(false));
    }
  }, [isEditing, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const specsObj = form.specifications ? JSON.parse(form.specifications) : null;

    const payload = {
      name: form.name,
      category: form.category,
      subcategory: form.subcategory || null,
      description: form.description || null,
      price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null,
      unit: form.unit,
      min_order_quantity: form.min_order_quantity ? parseInt(form.min_order_quantity) : null,
      available: form.available === 'Y',
      specifications: specsObj,
    };

    try {
      const url = isEditing ? `/api/products/${productId}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/products');
        router.refresh();
      } else {
        alert(data.error || 'Failed to save product');
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
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">{isEditing ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-sm text-muted-foreground mt-1">List your product in the catalog</p>
        </div>
        <Link href="/products"><Button variant="outline">Back to Products</Button></Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Product Name *</label>
          <Input value={form.name} onChange={e => updateField('name', e.target.value)} required placeholder="e.g., TMT Steel Bar Fe500" />
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
            <label className="text-sm font-medium mb-1 block">Subcategory</label>
            <Input value={form.subcategory} onChange={e => updateField('subcategory', e.target.value)} placeholder="e.g., Reinforcement" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the product specifications, quality, etc." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Price Per Unit (INR) *</label>
            <Input type="number" value={form.price_per_unit} onChange={e => updateField('price_per_unit', e.target.value)} required placeholder="500" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Unit</label>
            <select value={form.unit} onChange={e => updateField('unit', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Min Order Quantity</label>
            <Input type="number" value={form.min_order_quantity} onChange={e => updateField('min_order_quantity', e.target.value)} placeholder="100" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Availability</label>
          <div className="flex gap-3 mt-1">
            <label className="flex items-center gap-1"><input type="radio" name="available" value="Y" checked={form.available === 'Y'} onChange={e => updateField('available', e.target.value)} /> Available</label>
            <label className="flex items-center gap-1"><input type="radio" name="available" value="N" checked={form.available === 'N'} onChange={e => updateField('available', e.target.value)} /> Unavailable</label>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Specifications (JSON)</label>
          <textarea value={form.specifications} onChange={e => updateField('specifications', e.target.value)} rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none"
            placeholder='{"grade": "Fe500", "diameter": "12mm", "standard": "IS 1786"}' />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}</Button>
          <Link href="/products"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
