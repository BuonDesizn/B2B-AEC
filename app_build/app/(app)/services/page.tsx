// @witness [C-001]
'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Service {
  id: string;
  title: string;
  description?: string;
  price_per_hour?: number;
  price_per_project?: number;
  category: string;
  subcategory?: string;
  delivery_time_days?: number;
  requires_site_visit: boolean;
  is_active: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price_per_hour: '', price_per_project: '', category: '', subcategory: '', delivery_time_days: '', requires_site_visit: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/services', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setServices(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price_per_hour: form.price_per_hour ? parseFloat(form.price_per_hour) : null, price_per_project: form.price_per_project ? parseFloat(form.price_per_project) : null, delivery_time_days: form.delivery_time_days ? parseInt(form.delivery_time_days) : null }),
      });
      const data = await res.json();
      if (data.success) {
        setServices(prev => [...prev, data.data]);
        setShowForm(false);
        setForm({ title: '', description: '', price_per_hour: '', price_per_project: '', category: '', subcategory: '', delivery_time_days: '', requires_site_visit: false });
      }
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE', credentials: 'include' });
    setServices(prev => prev.filter(s => s.id !== id));
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">My Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your consulting services</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Service'}</Button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Service</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Service Title *</label>
            <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Structural Analysis" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the service..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Input value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g., Engineering" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subcategory</label>
              <Input value={form.subcategory} onChange={e => setForm(prev => ({ ...prev, subcategory: e.target.value }))} placeholder="e.g., Structural" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Delivery Time (days)</label>
              <Input type="number" value={form.delivery_time_days} onChange={e => setForm(prev => ({ ...prev, delivery_time_days: e.target.value }))} placeholder="7" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Price Per Hour (INR)</label>
              <Input type="number" value={form.price_per_hour} onChange={e => setForm(prev => ({ ...prev, price_per_hour: e.target.value }))} placeholder="5000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Price Per Project (INR)</label>
              <Input type="number" value={form.price_per_project} onChange={e => setForm(prev => ({ ...prev, price_per_project: e.target.value }))} placeholder="50000" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.requires_site_visit} onChange={e => setForm(prev => ({ ...prev, requires_site_visit: e.target.checked }))} id="site_visit" />
            <label htmlFor="site_visit" className="text-sm">Requires Site Visit</label>
          </div>
          <Button onClick={handleAdd} disabled={submitting || !form.title}>{submitting ? 'Adding...' : 'Add Service'}</Button>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No services listed yet</p>
          <p className="text-sm mt-1">Add your first service to attract clients</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{s.title}</h3>
                <Badge variant="outline">{s.category}</Badge>
              </div>
              {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
              {s.price_per_hour && <p className="text-sm font-medium">₹{s.price_per_hour.toLocaleString('en-IN')}/hr</p>}
              {s.price_per_project && <p className="text-sm font-medium">₹{s.price_per_project.toLocaleString('en-IN')}/project</p>}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
