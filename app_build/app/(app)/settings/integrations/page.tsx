// @witness [ID-001]
'use client';

import { useMemo, useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function IntegrationsPage() {
  const [form, setForm] = useState({ linkedin_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('linkedin_url').eq('id', user.id).single();
      if (data) setForm({ linkedin_url: data.linkedin_url || '' });
      setLoading(false);
    })();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ linkedin_url: form.linkedin_url || null }).eq('id', user.id);
    setSaving(false);
    setMessage(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Integration saved' });
  };

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect your social profiles</p>
      </div>
      {message && <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message.text}</div>}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">LinkedIn URL</label>
          <Input value={form.linkedin_url} onChange={e => setForm(prev => ({ ...prev, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/yourprofile" />
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  );
}
