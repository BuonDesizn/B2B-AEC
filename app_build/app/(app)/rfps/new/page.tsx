// @witness [UI-001]
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'PROJECT', label: 'Project' },
];

const TARGET_PERSONAS = [
  { value: 'PP', label: 'Project Professionals' },
  { value: 'C', label: 'Consultants' },
  { value: 'CON', label: 'Contractors' },
  { value: 'PS', label: 'Product Sellers' },
  { value: 'ED', label: 'Equipment Dealers' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function CreateRFPPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'draft' | 'publish'>('draft');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(1);

  const [form, setForm] = useState({
    title: '',
    category: '',
    subcategory: '',
    budget_min: '',
    budget_max: '',
    project_city: '',
    project_state: '',
    project_address: '',
    location_pin: '',
    description: '',
    requirements: '',
    target_personas: [] as string[],
    expiry_date: '',
    estimated_duration_days: '',
    request_type: 'PROJECT' as 'PRODUCT' | 'SERVICE' | 'EQUIPMENT' | 'PROJECT',
  });

  const update = (field: string, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const togglePersona = (persona: string) => {
    setForm(prev => ({
      ...prev,
      target_personas: prev.target_personas.includes(persona)
        ? prev.target_personas.filter(p => p !== persona)
        : [...prev.target_personas, persona],
    }));
  };

  const handleSubmit = async (mode: 'draft' | 'publish') => {
    setSubmitting(true);
    setSubmitMode(mode);
    setError('');

    if (!form.title || !form.category || !form.expiry_date) {
      setError('Title, Category, and Expiry Date are required');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/rfps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          subcategory: form.subcategory || undefined,
          description: form.description || undefined,
          budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
          budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
          project_city: form.project_city || undefined,
          project_state: form.project_state || undefined,
          location: form.project_address || `${form.project_city || ''}, ${form.project_state || ''}`,
          target_personas: form.target_personas,
          request_type: form.request_type,
          requirements: form.requirements ? { text: form.requirements } : {},
          expiry_date: new Date(form.expiry_date).toISOString(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        const rfpId = data.data.id;
        if (mode === 'publish') {
          await fetch(`/api/rfps/${rfpId}/publish`, {
            method: 'POST',
            credentials: 'include',
          });
        }
        router.push(`/rfps/${rfpId}`);
      } else {
        setError(data.error?.message || 'Failed to create RFP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sections = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Details' },
    { num: 4, label: 'Timeline' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create RFP</h1>
          <p className="text-sm text-muted-foreground">Request for Proposal — fill in the details below</p>
        </div>
        <Link href="/rfps">
          <Button variant="outline">Back to RFPs</Button>
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map(s => (
          <button
            key={s.num}
            onClick={() => setActiveSection(s.num)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === s.num
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {s.num}. {s.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        {activeSection === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g., Interior Design for Office Space"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Request Type *</label>
                <select
                  value={form.request_type}
                  onChange={e => update('request_type', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <select
                  value={form.category}
                  onChange={e => update('category', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Subcategory</label>
                <Input
                  value={form.subcategory}
                  onChange={e => update('subcategory', e.target.value)}
                  placeholder="e.g., HVAC, Electrical"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Budget Min (INR)</label>
                <Input
                  type="number"
                  value={form.budget_min}
                  onChange={e => update('budget_min', e.target.value)}
                  placeholder="e.g., 500000"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Budget Max (INR)</label>
                <Input
                  type="number"
                  value={form.budget_max}
                  onChange={e => update('budget_max', e.target.value)}
                  placeholder="e.g., 1000000"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Project Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input
                  value={form.project_city}
                  onChange={e => update('project_city', e.target.value)}
                  placeholder="e.g., Mumbai"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">State</label>
                <select
                  value={form.project_state}
                  onChange={e => update('project_state', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Address</label>
              <Input
                value={form.project_address}
                onChange={e => update('project_address', e.target.value)}
                placeholder="Street address or landmark"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location Pin (coordinates or description)</label>
              <Input
                value={form.location_pin}
                onChange={e => update('location_pin', e.target.value)}
                placeholder="e.g., 19.0760, 72.8777 or &quot;Near Gateway of India&quot;"
              />
            </div>
          </div>
        )}

        {activeSection === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Project Details</h2>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Describe your project scope and objectives..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Requirements</label>
              <textarea
                value={form.requirements}
                onChange={e => update('requirements', e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="List specific requirements, qualifications, deliverables..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Target Personas</label>
              <p className="text-xs text-muted-foreground mb-2">Select who can respond to this RFP</p>
              <div className="flex flex-wrap gap-2">
                {TARGET_PERSONAS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePersona(p.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.target_personas.includes(p.value)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <div>
              <label className="text-sm font-medium mb-1 block">Expiry Date *</label>
              <Input
                type="date"
                value={form.expiry_date}
                onChange={e => update('expiry_date', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estimated Duration (days)</label>
              <Input
                type="number"
                value={form.estimated_duration_days}
                onChange={e => update('estimated_duration_days', e.target.value)}
                placeholder="e.g., 90"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {activeSection > 1 && (
              <Button variant="outline" onClick={() => setActiveSection(activeSection - 1)}>
                Previous
              </Button>
            )}
            {activeSection < 4 && (
              <Button onClick={() => setActiveSection(activeSection + 1)}>
                Next
              </Button>
            )}
          </div>
          {activeSection === 4 && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => handleSubmit('draft')}
              >
                {submitting && submitMode === 'draft' ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                disabled={submitting}
                onClick={() => handleSubmit('publish')}
              >
                {submitting && submitMode === 'publish' ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
