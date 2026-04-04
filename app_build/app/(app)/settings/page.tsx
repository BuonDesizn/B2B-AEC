'use client';

import Link from 'next/link';

export default function SettingsPage() {
  const sections = [
    { href: '/settings/billing', label: 'Billing', icon: '💳' },
    { href: '/settings/contact', label: 'Contact', icon: '📧' },
    { href: '/settings/gstin', label: 'GSTIN', icon: '🏢' },
    { href: '/settings/integrations', label: 'Integrations', icon: '🔗' },
    { href: '/settings/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/settings/password', label: 'Password', icon: '🔒' },
    { href: '/settings/privacy', label: 'Privacy', icon: '🛡️' },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold font-[var(--font-playfair)]">Settings</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{section.icon}</span>
              <span className="font-medium">{section.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}