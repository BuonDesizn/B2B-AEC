// @witness [MON-001]
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentPendingPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    const timeout = setTimeout(() => router.push('/payment/success'), 30000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <div className="animate-spin w-12 h-12 border-4 border-[#42207A] border-t-transparent rounded-full mx-auto" />
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Payment Processing</h1>
        <p className="text-sm text-muted-foreground">Please wait while we confirm your payment. This may take a few moments.</p>
        <p className="text-xs text-muted-foreground">Auto-refreshing in {30 - seconds}s...</p>
      </div>
    </div>
  );
}
