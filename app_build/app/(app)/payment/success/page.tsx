// @witness [MON-001]
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">✅</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Payment Successful!</h1>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Your subscription has been activated.</p>
          <p className="text-sm">Handshake credits reset to <strong>30</strong></p>
          <p className="text-sm">Next reset: <strong>1st of next month</strong></p>
        </div>
        <Button onClick={() => router.push('/dashboard')} className="w-full">Continue to Dashboard</Button>
      </div>
    </div>
  );
}
