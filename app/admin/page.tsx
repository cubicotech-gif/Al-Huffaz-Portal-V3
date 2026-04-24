import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export default async function AdminHome() {
  const { profile } = await requireRole(['admin', 'staff']);
  const supabase = await createClient();

  const [
    { count: activeStudents },
    { count: sponsoredStudents },
    { count: pendingSponsors },
    { count: pendingRequests },
    { count: pendingPayments },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .is('archived_at', null),
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('is_sponsored', true)
      .is('archived_at', null),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'pending_sponsor')
      .eq('is_active', true),
    supabase
      .from('sponsorships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'requested'),
    supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
  ]);

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Admin dashboard</h1>
      <p className="mb-8 text-sm text-slate-600">Welcome back, {profile.full_name}.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Active students" value={activeStudents ?? 0} />
        <Stat label="Sponsored" value={sponsoredStudents ?? 0} />
        <Stat label="Pending sponsors" value={pendingSponsors ?? 0} />
        <Stat label="Open requests" value={pendingRequests ?? 0} />
        <Stat label="Payments to verify" value={pendingPayments ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NavCard
          href="/admin/students"
          title="Students"
          body="Browse, create, and manage the student roll."
          cta="Open roll"
        />
        <NavCard
          href="/admin/sponsorships?status=requested"
          title="Sponsorship queue"
          body={`${pendingRequests ?? 0} request${pendingRequests === 1 ? '' : 's'} waiting for review.`}
          cta="Review"
        />
        <NavCard
          href="/admin/payments?status=submitted"
          title="Payments queue"
          body={`${pendingPayments ?? 0} payment${pendingPayments === 1 ? '' : 's'} awaiting verification.`}
          cta="Verify"
        />
        {profile.role === 'admin' ? (
          <NavCard
            href="/admin/sponsors/pending"
            title="Sponsor approvals"
            body={`${pendingSponsors ?? 0} pending sponsor account${pendingSponsors === 1 ? '' : 's'}.`}
            cta="Review"
          />
        ) : null}
        {profile.role === 'admin' ? (
          <NavCard
            href="/admin/sponsors"
            title="Sponsors"
            body="Manage sponsor accounts — pause, reactivate, delete, re-engage."
            cta="Open"
          />
        ) : null}
        {profile.role === 'admin' ? (
          <NavCard
            href="/admin/staff"
            title="Staff"
            body="Grant or revoke staff access by email."
            cta="Manage"
          />
        ) : null}
        <NavCard
          href="/admin/students/new"
          title="New student"
          body="Add a new student record."
          cta="Create"
        />
        <NavCard
          href="/admin/students/import"
          title="Bulk import"
          body="Import a CSV to add many students at once."
          cta="Import"
        />
        {profile.role === 'admin' ? (
          <NavCard
            href="/admin/activity"
            title="Activity log"
            body="Audit every write action across the portal."
            cta="Open"
          />
        ) : null}
        {profile.role === 'admin' ? (
          <NavCard
            href="/admin/settings"
            title="Settings"
            body="School info, currency, academic year, and exports."
            cta="Open"
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function NavCard({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-slate-600">{body}</p>
      <span className="mt-4 text-sm font-semibold text-brand-600">{cta} →</span>
    </Link>
  );
}
