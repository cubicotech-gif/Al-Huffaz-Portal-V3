import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { listSponsors, type SponsorListFilters } from '@/lib/sponsors/queries';

export const runtime = 'edge';

const TABS: { value: 'active' | 'paused' | 'deleted' | 'all'; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'all', label: 'All' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  deleted: 'bg-slate-100 text-slate-600',
};

export default async function SponsorsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { profile } = await requireRole(['admin']);
  const params = await searchParams;
  const status: SponsorListFilters['status'] =
    (TABS.find((t) => t.value === params.status)?.value ?? 'active');

  const rows = await listSponsors({ q: params.q, status });

  return (
    <DashboardShell role="Admin" name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Sponsors</h1>
          <p className="text-sm text-slate-600">
            {rows.length} {status} sponsor{rows.length === 1 ? '' : 's'}.
          </p>
        </div>
        <Link
          href="/admin/sponsors/pending"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          Pending approvals →
        </Link>
      </div>

      <nav className="mb-4 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/sponsors?status=${t.value}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}`}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              status === t.value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <form method="get" className="mb-6">
        <input type="hidden" name="status" value={status} />
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search by name or email"
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
          No sponsors match these filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.display_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.country ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.active_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                        STATUS_COLORS[s.account_status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.account_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/sponsors/${s.id}`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
