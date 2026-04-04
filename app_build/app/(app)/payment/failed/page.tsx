// @witness [MON-001]
'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">❌</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Payment Failed</h1>
        <p className="text-sm text-muted-foreground">Your payment could not be processed. Please check your payment method and try again.</p>
        <div className="space-y-3">
          <Button onClick={() => router.push('/plan')} className="w-full">Retry Payment</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
