// @witness [MON-001]
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function HardLockPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">🔒</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Trial Expired</h1>
        <p className="text-sm text-muted-foreground">Your 48-hour trial has ended. Upgrade to National Pro to continue enjoying full access.</p>
        <div className="p-4 bg-muted rounded-lg text-sm text-left space-y-2">
          <p className="font-medium">Features restricted on free plan:</p>
          <ul className="text-muted-foreground space-y-1">
            <li>• 🔒 Discovery search limited</li>
            <li>• 🔒 Handshake credits exhausted</li>
            <li>• 🔒 RFP creation disabled</li>
            <li>• 🔒 Ad campaigns paused</li>
          </ul>
        </div>
        <div className="space-y-3">
          <Button onClick={() => router.push('/plan')} className="w-full">Upgrade to National Pro</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">View Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
