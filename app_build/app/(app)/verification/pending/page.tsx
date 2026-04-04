// @witness [ID-001]
'use client';

export default function VerificationPendingPage() {
  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">⏳</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Verification Pending</h1>
        <p className="text-sm text-muted-foreground">Your profile is under review by our admin team. This typically takes 24-48 hours.</p>
        <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
          <p className="font-medium">What happens next?</p>
          <ul className="text-left text-muted-foreground space-y-1">
            <li>• Our team will verify your GSTIN/PAN details</li>
            <li>• You&apos;ll receive an email notification once verified</li>
            <li>• Your 48-hour trial is active during this period</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
