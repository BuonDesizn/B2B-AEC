// @witness [ID-001]
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const router = useRouter();
  const supabase = createClient();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.auth.resend({ type: 'signup', email: user.email! });
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">📧</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Email Verification Required</h1>
        <p className="text-sm text-muted-foreground">We&apos;ve sent a verification link to your email. Please check your inbox and spam folder.</p>
        {sent && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">Verification email resent!</div>}
        <div className="space-y-3">
          <Button onClick={handleResend} disabled={loading} className="w-full">{loading ? 'Sending...' : 'Resend Verification Email'}</Button>
          <Button variant="outline" onClick={() => router.push('/auth/login')} className="w-full">Back to Login</Button>
        </div>
      </div>
    </div>
  );
}
