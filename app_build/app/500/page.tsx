// @witness [UI-001]
'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <p className="text-8xl font-bold font-[var(--font-playfair)] text-[#42207A]">500</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Internal Server Error</h1>
        <p className="text-muted-foreground max-w-md">Something went wrong on our end. Please try refreshing the page or contact support if the issue persists.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
