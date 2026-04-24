import { NotificationBell } from '@/components/notification-bell';
import { SignOutButton } from '@/components/signout-button';
import { Sidebar } from '@/components/sidebar';

function navRoleFromDisplay(role: string): 'admin' | 'staff' | 'sponsor' {
  const v = role.toLowerCase();
  if (v === 'admin') return 'admin';
  if (v === 'staff') return 'staff';
  return 'sponsor';
}

export function DashboardShell({
  role,
  name,
  children,
  notificationsHref = '/sponsor/notifications',
}: {
  role: string;
  name: string;
  children: React.ReactNode;
  notificationsHref?: string;
}) {
  const navRole = navRoleFromDisplay(role);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={navRole} />

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="hidden flex-col items-end text-right sm:flex">
              <span className="text-sm font-semibold text-slate-900">{name}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-brand-600">
                {role}
              </span>
            </div>
            <NotificationBell href={notificationsHref} />
            <SignOutButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
