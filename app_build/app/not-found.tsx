// @witness [UI-001]
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F3F0F7] flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <p className="text-8xl font-bold font-[var(--font-playfair)] text-[#42207A]">404</p>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Page Not Found</h1>
        <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <a href="/dashboard" className="inline-block px-6 py-3 bg-[#42207A] text-white rounded-md hover:bg-[#42207A]/90 transition-colors">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
