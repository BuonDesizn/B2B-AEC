// @witness [COM-001]
'use client';

import { useMemo, useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function ContactPreferencesPage() {
  const [form, setForm] = useState({ phone_primary: '', phone_secondary: '', email_business: '', linkedin_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('phone_primary, phone_secondary, email_business, linkedin_url').eq('id', user.id).single();
      if (data) {
        setForm({
          phone_primary: data.phone_primary || '',
          phone_secondary: data.phone_secondary || '',
          email_business: data.email_business || '',
          linkedin_url: data.linkedin_url || '',
        });
      }
      setLoading(false);
    })();
  }, [supabase]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        phone_primary: form.phone_primary || null,
        phone_secondary: form.phone_secondary || null,
        email_business: form.email_business || null,
        linkedin_url: form.linkedin_url || null,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Contact info saved' });
    }
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Contact Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">How professionals can reach you</p>
      </div>
      {message && <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message.text}</div>}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Primary Phone</label>
          <Input value={form.phone_primary} onChange={e => update('phone_primary', e.target.value)} placeholder="+91 98765 43210" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Secondary Phone</label>
          <Input value={form.phone_secondary} onChange={e => update('phone_secondary', e.target.value)} placeholder="+91 98765 43211" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Business Email</label>
          <Input type="email" value={form.email_business} onChange={e => update('email_business', e.target.value)} placeholder="business@company.com" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">LinkedIn URL</label>
          <Input value={form.linkedin_url} onChange={e => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Contact Info'}</Button>
      </div>
    </div>
  );
}
