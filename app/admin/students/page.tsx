import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { listStudents, type StudentListFilters } from '@/lib/students/queries';
import { GRADE_LEVELS } from '@/lib/students/schema';

export const runtime = 'edge';

type SearchParams = {
  q?: string;
  grade_level?: string;
  donation?: string;
  archived?: string;
  page?: string;
};

export default async function StudentsListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const params = await searchParams;

  const filters: StudentListFilters = {
    q: params.q,
    gradeLevel: params.grade_level,
    donationEligible:
      params.donation === 'true' || params.donation === 'false' ? params.donation : undefined,
    archived: params.archived === 'true' ? 'true' : 'false',
    page: params.page ? Number(params.page) : 1,
  };

  const { rows, total, page, totalPages } = await listStudents(filters);

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-sm text-slate-600">
            {total} {filters.archived === 'true' ? 'archived' : 'active'} student{total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/students/import"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            Import CSV
          </Link>
          <a
            href="/api/admin/exports/students"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            Export CSV
          </a>
          <Link
            href="/admin/students/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            + New student
          </Link>
        </div>
      </div>

      <form method="get" className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-5">
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search by name or GR number"
          className="sm:col-span-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <select
          name="grade_level"
          defaultValue={params.grade_level ?? ''}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">All grades</option>
          {GRADE_LEVELS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          name="donation"
          defaultValue={params.donation ?? ''}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">All eligibility</option>
          <option value="true">Donation-eligible</option>
          <option value="false">Not donation-eligible</option>
        </select>
        <select
          name="archived"
          defaultValue={params.archived ?? 'false'}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="false">Active</option>
          <option value="true">Archived</option>
        </select>
        <button
          type="submit"
          className="sm:col-span-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Apply filters
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">No students match your filters.</p>
          <Link
            href="/admin/students/new"
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            Add the first one →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">GR #</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.gr_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.grade_level ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{s.islamic_category ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusPills row={s} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} params={params} />
      ) : null}
    </DashboardShell>
  );
}

function StatusPills({ row }: { row: { donation_eligible: boolean; is_sponsored: boolean; archived_at: string | null } }) {
  const pills: { label: string; color: string }[] = [];
  if (row.archived_at) pills.push({ label: 'Archived', color: 'bg-slate-100 text-slate-600' });
  if (row.donation_eligible && !row.is_sponsored)
    pills.push({ label: 'Available', color: 'bg-emerald-100 text-emerald-700' });
  if (row.is_sponsored) pills.push({ label: 'Sponsored', color: 'bg-brand-100 text-brand-700' });
  if (!pills.length) pills.push({ label: 'Active', color: 'bg-slate-100 text-slate-700' });
  return (
    <div className="flex flex-wrap gap-1">
      {pills.map((p) => (
        <span key={p.label} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${p.color}`}>
          {p.label}
        </span>
      ))}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: SearchParams;
}) {
  const base = new URLSearchParams();
  if (params.q) base.set('q', params.q);
  if (params.grade_level) base.set('grade_level', params.grade_level);
  if (params.donation) base.set('donation', params.donation);
  if (params.archived) base.set('archived', params.archived);

  const link = (p: number) => {
    const q = new URLSearchParams(base);
    q.set('page', String(p));
    return `/admin/students?${q.toString()}`;
  };

  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <span className="text-slate-600">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={link(page - 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-300"
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={link(page + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-300"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
