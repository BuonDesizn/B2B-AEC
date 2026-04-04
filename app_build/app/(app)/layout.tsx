import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

import { Sidebar } from './sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('persona_type, org_name, avatar_url, subscription_status, handshake_credits')
    .eq('id', session.user.id)
    .single();

  const role = profile?.persona_type || 'PP';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} />
      <div className="md:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-end gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.org_name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {profile?.org_name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
