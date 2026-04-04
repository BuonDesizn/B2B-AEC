// @witness [UI-001]
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ROLES = [
  { key: 'PP', label: 'Project Professionals', color: 'bg-[#E7D9F5] text-[#6415A5]', count: 0 },
  { key: 'C', label: 'Consultants', color: 'bg-[#D1F2E2] text-[#0D6F41]', count: 0 },
  { key: 'CON', label: 'Contractors', color: 'bg-[#F7E9C1] text-[#8B5D14]', count: 0 },
  { key: 'PS', label: 'Product Sellers', color: 'bg-[#D9E4F5] text-[#1C4E8A]', count: 0 },
  { key: 'ED', label: 'Equipment Dealers', color: 'bg-[#E1D3F5] text-[#7045AA]', count: 0 },
];

async function getStats() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { total_profiles: 0, role_distribution: {} };
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=persona_type`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) {
      return { total_profiles: 0, role_distribution: {} };
    }

    const profiles = await res.json();
    const total_profiles = Array.isArray(profiles) ? profiles.length : 0;
    
    const role_distribution: Record<string, number> = {};
    if (Array.isArray(profiles)) {
      profiles.forEach((p: any) => {
        if (p.persona_type) {
          role_distribution[p.persona_type] = (role_distribution[p.persona_type] || 0) + 1;
        }
      });
    }

    return { total_profiles, role_distribution };
  } catch {
    return { total_profiles: 0, role_distribution: {} };
  }
}

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-[#F3F0F7]">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏗️</span>
              <span className="text-xl font-bold font-[var(--font-playfair)] text-[#42207A]">
                BuonDesizn
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[var(--font-playfair)] text-[#42207A]">
              Discover Trusted B2B Connections
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with verified Project Professionals, Consultants, Contractors, and more. 
              Your next business partnership starts here.
            </p>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                  placeholder="Search by name, specialty, or keyword" 
                  className="flex-1 h-12 text-base"
                />
                <Input 
                  placeholder="Location" 
                  className="sm:w-48 h-12 text-base"
                />
                <Button size="lg" className="h-12 px-8">Search</Button>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link href="/discover?role=PP">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${ROLES[0].color}`}>
                    Project Professionals
                  </span>
                </Link>
                <Link href="/discover?role=C">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${ROLES[1].color}`}>
                    Consultants
                  </span>
                </Link>
                <Link href="/discover?role=CON">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${ROLES[2].color}`}>
                    Contractors
                  </span>
                </Link>
                <Link href="/discover?role=PS">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${ROLES[3].color}`}>
                    Product Sellers
                  </span>
                </Link>
                <Link href="/discover?role=ED">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${ROLES[4].color}`}>
                    Equipment Dealers
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {ROLES.map((role) => (
                <Link key={role.key} href={`/discover?role=${role.key}`}>
                  <div className={`${role.color} rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer`}>
                    <p className="text-3xl font-bold">{stats.role_distribution[role.key] || role.count}</p>
                    <p className="text-sm font-medium mt-1">{role.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-playfair)] text-center mb-4">
              Why Choose BuonDesizn?
            </h2>
            <div className="grid sm:grid-cols-3 gap-8 mt-10">
              <div className="text-center space-y-3">
                <span className="text-4xl">🔍</span>
                <h3 className="font-semibold">Smart Discovery</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered proximity ranking finds the best matches near you
                </p>
              </div>
              <div className="text-center space-y-3">
                <span className="text-4xl">✅</span>
                <h3 className="font-semibold">Verified Profiles</h3>
                <p className="text-sm text-muted-foreground">
                  GSTIN & PAN verification ensures authentic business connections
                </p>
              </div>
              <div className="text-center space-y-3">
                <span className="text-4xl">🤝</span>
                <h3 className="font-semibold">Handshake Economy</h3>
                <p className="text-sm text-muted-foreground">
                  Secure connections with transparent credit-based system
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-playfair)]">
              Ready to Grow Your Network?
            </h2>
            <p className="text-muted-foreground">
              Join {stats.total_profiles.toLocaleString()}+ professionals already on the platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8">Create Free Account</Button>
              </Link>
              <Link href="/discover">
                <Button variant="outline" size="lg" className="px-8">Explore Directory</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 BuonDesizn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
