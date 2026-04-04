// @witness [UI-001]
'use client';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <p className="text-5xl">🔧</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)] text-[#42207A]">Under Maintenance</h1>
        <p className="text-sm text-muted-foreground">BuonDesizn is currently undergoing scheduled maintenance. We&apos;ll be back shortly.</p>
        <p className="text-xs text-muted-foreground">Expected downtime: 30 minutes</p>
      </div>
    </div>
  );
}
