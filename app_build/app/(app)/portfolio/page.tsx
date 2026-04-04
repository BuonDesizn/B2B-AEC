// @witness [PP-001]
'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_type: string | null;
  created_at: string;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', project_type: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/profiles/me/portfolio', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setItems(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/profiles/me/portfolio', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => [...prev, data.data]);
        setShowForm(false);
        setForm({ title: '', description: '', project_type: '' });
      }
    } catch {}
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/profiles/me/portfolio/${id}`, { method: 'DELETE', credentials: 'include' });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">Showcase your work samples and projects</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Project'}</Button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add Portfolio Item</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Project Title *</label>
            <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., Mumbai Office Tower" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Project Type</label>
            <input value={form.project_type} onChange={e => setForm(prev => ({ ...prev, project_type: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="e.g., Commercial, Residential" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the project scope and your role..." />
          </div>
          <Button onClick={handleAdd} disabled={submitting || !form.title}>{submitting ? 'Adding...' : 'Add Project'}</Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          <p className="text-lg font-medium">No portfolio items yet</p>
          <p className="text-sm mt-1">Add your first project to showcase your expertise</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{item.title}</h3>
                {item.project_type && <Badge variant="outline">{item.project_type}</Badge>}
              </div>
              {item.description && <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>}
              <p className="text-xs text-muted-foreground">Added {new Date(item.created_at).toLocaleDateString()}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
