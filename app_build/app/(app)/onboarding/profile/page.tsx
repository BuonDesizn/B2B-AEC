// @witness [ID-001]
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    org_name: '',
    designation: '',
    email: '',
    phone_primary: '',
    tagline: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();
      if (profile?.email) setForm(prev => ({ ...prev, email: profile.email }));
    })();
  }, []);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    if (!form.org_name.trim()) { setError('Organisation name is required'); setLoading(false); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); setLoading(false); return; }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          org_name: form.org_name,
          designation: form.designation || null,
          phone_primary: form.phone_primary || null,
          tagline: form.tagline || null,
          city: form.city || null,
          state: form.state || null,
        })
        .eq('id', user.id);
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      router.push('/dashboard');
    } catch { setError('An error occurred.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">Tell us about yourself</p>
        </div>
        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Organisation Name *</label>
            <Input value={form.org_name} onChange={e => update('org_name', e.target.value)} placeholder="e.g., ABC Designs Pvt Ltd" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Designation</label>
            <Input value={form.designation} onChange={e => update('designation', e.target.value)} placeholder="e.g., Senior Architect" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <Input value={form.email} disabled className="bg-muted" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <Input value={form.phone_primary} onChange={e => update('phone_primary', e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">City</label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="e.g., Mumbai" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">State</label>
              <Input value={form.state} onChange={e => update('state', e.target.value)} placeholder="e.g., Maharashtra" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">About / Tagline</label>
            <textarea value={form.tagline} onChange={e => update('tagline', e.target.value)} rows={4} maxLength={500}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Describe your expertise, experience, and what you offer..." />
            <p className="text-xs text-muted-foreground mt-1">{form.tagline.length}/500</p>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">{loading ? 'Saving...' : 'Complete Setup'}</Button>
        </div>
      </div>
    </div>
  );
}
