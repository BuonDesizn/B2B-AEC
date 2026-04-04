// @witness [UI-001]
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function MaskedProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetch(`/api/profiles/${resolvedParams.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setProfile(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [resolvedParams]);

  if (loading) return <div className="h-48 bg-muted rounded animate-pulse" />;
  if (!profile) return <div className="text-center py-12"><p className="text-lg text-muted-foreground">Profile not found</p></div>;

  return (
    <div className="min-h-screen bg-[#F3F0F7]">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground">← Back to Discover</Link>
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">{profile.org_name}</h1>
              <p className="text-muted-foreground mt-1">{profile.persona_type} · {profile.city || 'Unknown'}, {profile.state || ''}</p>
            </div>
            <Badge variant="outline">{profile.verification_status || 'Unverified'}</Badge>
          </div>
          {profile.tagline && (
            <div>
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.tagline}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="font-medium">Designation</p><p className="text-muted-foreground">{profile.designation || '-'}</p></div>
            <div><p className="font-medium">DQS Score</p><p className="text-muted-foreground">{profile.dqs_score || '-'}</p></div>
          </div>
          <div className="pt-4 border-t">
            <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="font-mono">***</p>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="font-mono">***</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Contact details are hidden. Send a handshake request to view.</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Link href="/auth/login" className="flex-1"><Button className="w-full">Sign In to Connect</Button></Link>
            <Link href="/discover" className="flex-1"><Button variant="outline" className="w-full">Browse More</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
