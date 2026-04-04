'use client';

export default function MyProjectsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold font-[var(--font-playfair)]">My Projects</h1>
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    </div>
  );
}