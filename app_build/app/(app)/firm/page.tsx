// @witness [C-001]
'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface FirmProfile {
  org_name: string;
  gstin: string;
  verification_status: string;
  logo_url: string | null;
}

interface Personnel {
  id: string;
  company_gstin: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  specialty: string[] | null;
  is_active: boolean;
  created_at: string;
}

export default function FirmProfilePage() {
  const [firm, setFirm] = useState<FirmProfile | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_name, gstin, verification_status, logo_url')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setFirm(profile as FirmProfile);
        const { data: team } = await supabase
          .from('company_personnel')
          .select('*')
          .eq('company_gstin', profile.gstin)
          .limit(50);
        if (team) setPersonnel(team as Personnel[]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;

  const verificationStatusColors: Record<string, string> = {
    VERIFIED: 'bg-green-100 text-green-800',
    PENDING_ADMIN: 'bg-amber-100 text-amber-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Firm Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your company information and verification status</p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{firm?.org_name || 'No firm name set'}</h2>
            <p className="text-sm text-muted-foreground">GSTIN: {firm?.gstin || 'Not provided'}</p>
          </div>
          {firm?.verification_status && (
            <Badge className={verificationStatusColors[firm.verification_status] || ''}>{firm.verification_status}</Badge>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Linked Personnel ({personnel.length})</h2>
        {personnel.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personnel linked to this firm</p>
        ) : (
          <div className="space-y-2">
            {personnel.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.designation || 'No designation'} · {p.specialty?.join(', ') || 'No specialty'}
                  </p>
                </div>
                <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
