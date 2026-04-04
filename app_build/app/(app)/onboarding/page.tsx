// @witness [ID-001]
'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

const ROLES = [
  { value: 'PP', label: 'Project Professional', desc: 'Architect, Engineer, Designer' },
  { value: 'C', label: 'Consultant', desc: 'Consulting Firm' },
  { value: 'CON', label: 'Contractor', desc: 'Construction Company' },
  { value: 'PS', label: 'Product Seller', desc: 'Manufacturer, Distributor' },
  { value: 'ED', label: 'Equipment Dealer', desc: 'Rental, Sales' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('PP');
  const [idType, setIdType] = useState<'individual' | 'company'>('individual');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
      }
    })();
  }, [supabase, router]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    if (!idNumber.trim()) { setError('ID number is required'); setLoading(false); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); setLoading(false); return; }
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          persona_type: selectedRole,
          ...(idType === 'individual' ? { pan: idNumber } : { gstin: idNumber }),
          verification_status: 'PENDING_ADMIN',
          subscription_status: 'trial',
          trial_started_at: new Date().toISOString(),
          handshake_credits: 30,
        })
        .eq('id', user.id);
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      router.push('/onboarding/profile');
    } catch { setError('An error occurred.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Welcome to BuonDesizn</h1>
          <p className="text-sm text-muted-foreground">Let&apos;s set up your profile</p>
        </div>
        <div className="flex gap-2 justify-center">
          <div className={`w-8 h-1 rounded ${step >= 1 ? 'bg-[#42207A]' : 'bg-muted'}`} />
          <div className={`w-8 h-1 rounded ${step >= 2 ? 'bg-[#42207A]' : 'bg-muted'}`} />
        </div>
        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Your Role</h2>
            <div className="grid gap-3">
              {ROLES.map(role => (
                <button key={role.value} onClick={() => setSelectedRole(role.value)}
                  className={`p-4 rounded-lg border text-left transition-all ${selectedRole === role.value ? 'border-[#42207A] bg-[#F3F0F7]' : 'border-border hover:bg-accent'}`}>
                  <p className="font-medium">{role.label}</p>
                  <p className="text-sm text-muted-foreground">{role.desc}</p>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep(2)} className="w-full">Continue</Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Identity Verification</h2>
            <div className="flex gap-2">
              <button onClick={() => { setIdType('individual'); setIdNumber(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${idType === 'individual' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                Individual (PAN)
              </button>
              <button onClick={() => { setIdType('company'); setIdNumber(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${idType === 'company' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                Company (GSTIN)
              </button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{idType === 'individual' ? 'PAN Number' : 'GSTIN'}</label>
              <Input value={idNumber} onChange={e => setIdNumber(e.target.value.toUpperCase())}
                placeholder={idType === 'individual' ? 'ABCDE1234F' : '22AAAAA0000A1Z5'}
                maxLength={idType === 'individual' ? 10 : 15} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">{loading ? 'Submitting...' : 'Continue to Profile Setup'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
