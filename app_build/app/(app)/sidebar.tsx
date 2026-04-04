'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const baseNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/discover', label: 'Discover', icon: '🔍' },
  { href: '/address-book', label: 'Address Book', icon: '📇' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/plan', label: 'My Plan', icon: '💳' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const roleSpecificItems: Record<string, NavItem[]> = {
  PP: [
    { href: '/rfps', label: 'My RFPs', icon: '📋' },
    { href: '/portfolio', label: 'Portfolio', icon: '🎨' },
    { href: '/my-projects', label: 'My Projects', icon: '🏗️' },
  ],
  C: [
    { href: '/rfps', label: 'My RFPs', icon: '📋' },
    { href: '/portfolio', label: 'Portfolio', icon: '🎨' },
    { href: '/my-projects', label: 'My Projects', icon: '🏗️' },
    { href: '/my-team', label: 'My Team', icon: '👥' },
    { href: '/firm-profile', label: 'Firm Profile', icon: '🏢' },
    { href: '/services', label: 'Services', icon: '💼' },
  ],
  CON: [
    { href: '/rfps', label: 'My RFPs', icon: '📋' },
    { href: '/portfolio', label: 'Portfolio', icon: '🎨' },
    { href: '/my-projects', label: 'My Projects', icon: '🏗️' },
    { href: '/my-team', label: 'My Team', icon: '👥' },
    { href: '/my-equipment', label: 'My Equipment', icon: '🚜' },
  ],
  PS: [
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/ads', label: 'Ads', icon: '📢' },
    { href: '/enquiries', label: 'Enquiries', icon: '✉️' },
  ],
  ED: [
    { href: '/equipment', label: 'Equipment', icon: '🚜' },
    { href: '/ads', label: 'Ads', icon: '📢' },
    { href: '/enquiries', label: 'Enquiries', icon: '✉️' },
  ],
};

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [...baseNavItems, ...(roleSpecificItems[role] || [])];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b border-border">
        {!collapsed && (
          <span className="font-bold text-lg font-[var(--font-playfair)]">BuonDesizn</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors hidden md:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === item.href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {(!collapsed) && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border md:hidden"
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r border-border transition-all duration-300 z-40
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
