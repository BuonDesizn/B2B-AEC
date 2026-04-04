// @witness [ID-001]
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SessionExpiredPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">🔑</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Session Expired</h1>
        <p className="text-sm text-muted-foreground">Your session has expired for security reasons. Please log in again to continue.</p>
        <Button onClick={() => router.push('/auth/login')} className="w-full">Login Again</Button>
      </div>
    </div>
  );
}
