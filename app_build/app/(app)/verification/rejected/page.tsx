// @witness [ID-001]
'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function VerificationRejectedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">❌</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Verification Rejected</h1>
        <p className="text-sm text-muted-foreground">Your identity verification could not be completed. This may be due to invalid or mismatched documents.</p>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-sm text-left space-y-2">
          <p className="font-medium text-red-600">Common reasons:</p>
          <ul className="text-muted-foreground space-y-1">
            <li>• PAN/GSTIN format is incorrect</li>
            <li>• Name mismatch between documents</li>
            <li>• Document is not active/valid</li>
          </ul>
        </div>
        <div className="space-y-3">
          <Button onClick={() => router.push('/onboarding')} className="w-full">Retry Verification</Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
