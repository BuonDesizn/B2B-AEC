// @witness [RFP-001]
'use client';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">My Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your active and completed projects</p>
      </div>
      <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border">
        <p className="text-5xl mb-4">🚧</p>
        <p className="text-xl font-semibold">Coming Soon</p>
        <p className="text-sm mt-2 max-w-md mx-auto">
          Project tracking is currently in development. You&apos;ll be able to manage timelines, milestones, and deliverables here.
        </p>
      </div>
    </div>
  );
}
