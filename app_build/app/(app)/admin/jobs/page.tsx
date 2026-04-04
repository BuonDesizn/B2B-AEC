// @witness [MON-001]
'use client';

export default function AdminJobsPage() {
  const jobs = [
    { name: 'RFP Expiry', description: 'Marks expired RFPs as EXPIRED', schedule: 'Every hour', status: 'Active' },
    { name: 'DQS Recalculation', description: 'Recalculates Discovery Quality Scores', schedule: 'Daily at 2 AM', status: 'Active' },
    { name: 'Credit Reset', description: 'Resets monthly handshake credits for subscribers', schedule: 'Monthly on 1st', status: 'Active' },
    { name: 'Trial Lock', description: 'Locks accounts after 48-hour trial expires', schedule: 'Every 6 hours', status: 'Active' },
    { name: 'Email Queue', description: 'Processes pending email notifications', schedule: 'Every 5 minutes', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Background Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor scheduled tasks</p>
      </div>
      <div className="space-y-3">
        {jobs.map(job => (
          <div key={job.name} className="rounded-lg border bg-card p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{job.name}</h3>
              <p className="text-sm text-muted-foreground">{job.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Schedule: {job.schedule}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{job.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
