export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-accent rounded-md" />
        <div className="h-4 w-96 bg-accent rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-6 space-y-3">
            <div className="h-8 w-8 bg-accent rounded-md" />
            <div className="h-8 w-16 bg-accent rounded-md" />
            <div className="h-4 w-32 bg-accent rounded-md" />
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        <div className="h-6 w-48 bg-accent rounded-md" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
            <div className="h-10 w-10 bg-accent rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-accent rounded-md" />
              <div className="h-3 w-1/2 bg-accent rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
