import { requireRole } from '@/lib/auth';
import { DashboardShell, PlaceholderCard } from '@/components/dashboard-shell';

export const runtime = 'edge';

export default async function AdminHome() {
  const { profile } = await requireRole(['admin', 'staff']);

  return (
    <DashboardShell role={profile.role === 'admin' ? 'Admin' : 'Staff'} name={profile.full_name}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <p className="mb-8 text-sm text-slate-600">
        Phase 1 placeholder. Student management, sponsor approvals, and payment verification land in
        Phase 2 and Phase 3.
      </p>
      <PlaceholderCard
        title="Nothing here yet"
        body="This is the admin landing page. Real stats and queues will appear as later phases ship."
      />
    </DashboardShell>
  );
}
