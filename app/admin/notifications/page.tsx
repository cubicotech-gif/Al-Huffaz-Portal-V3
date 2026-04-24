import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NotificationsList } from '@/components/notifications-list';

export const runtime = 'edge';

export default async function AdminNotificationsPage() {
  const { profile } = await requireRole(['admin', 'staff']);
  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Notifications</h1>
      </div>
      <NotificationsList userId={profile.id} />
    </DashboardShell>
  );
}
