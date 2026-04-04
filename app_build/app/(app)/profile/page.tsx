// @witness [UI-001]
'use client';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/profiles/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setProfile(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profiles/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setProfile(data.data);
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: any) => setProfile((prev: any) => ({ ...prev, [field]: value }));

  if (loading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>;
  if (!profile) return <div className="text-center py-12 text-muted-foreground">Failed to load profile</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">My Profile</h1>
      
      {message && (
        <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div><label className="text-sm font-medium mb-1 block">Organisation Name</label><Input value={profile.org_name || ''} onChange={e => update('org_name', e.target.value)} /></div>
        <div><label className="text-sm font-medium mb-1 block">Email</label><Input value={profile.email || ''} disabled className="bg-muted" /></div>
        <div><label className="text-sm font-medium mb-1 block">Mobile</label><Input value={profile.phone_primary || ''} onChange={e => update('phone_primary', e.target.value)} /></div>
        <div><label className="text-sm font-medium mb-1 block">About</label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={profile.tagline || ''} onChange={e => update('tagline', e.target.value)} /></div>

        {profile.persona_type === 'PP' && (
          <>
            <div><label className="text-sm font-medium mb-1 block">Designation</label><Input value={profile.designation || ''} onChange={e => update('designation', e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1 block">Experience (years)</label><Input type="number" value={profile.experience_years || ''} onChange={e => update('experience_years', parseInt(e.target.value) || 0)} /></div>
            <div><label className="text-sm font-medium mb-1 block">Specialization</label><Input value={profile.specialization || ''} onChange={e => update('specialization', e.target.value)} /></div>
            <div><label className="text-sm font-medium mb-1 block">COA Number</label><Input value={profile.coa_number || ''} onChange={e => update('coa_number', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Min Hourly Rate (₹)</label><Input type="number" value={profile.hourly_rate_min || ''} onChange={e => update('hourly_rate_min', parseInt(e.target.value) || 0)} /></div>
              <div><label className="text-sm font-medium mb-1 block">Max Hourly Rate (₹)</label><Input type="number" value={profile.hourly_rate_max || ''} onChange={e => update('hourly_rate_max', parseInt(e.target.value) || 0)} /></div>
            </div>
          </>
        )}

        {profile.persona_type === 'C' && (
          <>
            <div><label className="text-sm font-medium mb-1 block">Company Type</label>
              <select value={profile.company_type || ''} onChange={e => update('company_type', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="Proprietorship">Proprietorship</option>
                <option value="Partnership">Partnership</option>
                <option value="Private Limited">Private Limited</option>
                <option value="LLP">LLP</option>
                <option value="Public Limited">Public Limited</option>
              </select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Services Offered (comma-separated)</label><Input value={(profile.services_offered || []).join(', ')} onChange={e => update('services_offered', e.target.value.split(',').map((s: string) => s.trim()))} /></div>
            <div><label className="text-sm font-medium mb-1 block">Largest Project Value (₹)</label><Input type="number" value={profile.largest_project_value || ''} onChange={e => update('largest_project_value', parseFloat(e.target.value) || 0)} /></div>
          </>
        )}

        {profile.persona_type === 'CON' && (
          <>
            <div><label className="text-sm font-medium mb-1 block">Workforce Count</label><Input type="number" value={profile.workforce_count || ''} onChange={e => update('workforce_count', parseInt(e.target.value) || 0)} /></div>
            <div><label className="text-sm font-medium mb-1 block">License Class</label>
              <select value={profile.license_class || ''} onChange={e => update('license_class', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="Class I">Class I</option>
                <option value="Class II">Class II</option>
                <option value="Class III">Class III</option>
                <option value="Unlimited">Unlimited</option>
              </select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Concurrent Projects Capacity</label><Input type="number" value={profile.concurrent_projects_capacity || ''} onChange={e => update('concurrent_projects_capacity', parseInt(e.target.value) || 1)} /></div>
            <div><label className="text-sm font-medium mb-1 block">Fleet Size</label><Input type="number" value={profile.fleet_size || ''} onChange={e => update('fleet_size', parseInt(e.target.value) || 0)} /></div>
          </>
        )}

        {profile.persona_type === 'PS' && (
          <>
            <div><label className="text-sm font-medium mb-1 block">Business Type</label>
              <select value={profile.business_type || ''} onChange={e => update('business_type', e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Delivery Radius (km)</label><Input type="number" value={profile.delivery_radius_km || ''} onChange={e => update('delivery_radius_km', parseInt(e.target.value) || 0)} /></div>
            <div><label className="text-sm font-medium mb-1 block">Credit Period (days)</label><Input type="number" value={profile.credit_period_days || ''} onChange={e => update('credit_period_days', parseInt(e.target.value) || 0)} /></div>
          </>
        )}

        {profile.persona_type === 'ED' && (
          <>
            <div><label className="text-sm font-medium mb-1 block">Total Equipment Count</label><Input type="number" value={profile.total_equipment_count || ''} onChange={e => update('total_equipment_count', parseInt(e.target.value) || 0)} /></div>
            <div><label className="text-sm font-medium mb-1 block">Rental Categories (comma-separated)</label><Input value={(profile.rental_categories || []).join(', ')} onChange={e => update('rental_categories', e.target.value.split(',').map((s: string) => s.trim()))} /></div>
          </>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
    </div>
  );
}
