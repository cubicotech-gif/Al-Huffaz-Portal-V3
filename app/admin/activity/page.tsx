import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

const PAGE_SIZE = 50;

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ object_type?: string; action?: string; page?: string }>;
}) {
  const { profile } = await requireRole(['admin']);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let query = supabase
    .from('activity_log')
    .select('id, action, object_type, object_id, details, created_at, actor:profiles(full_name)', {
      count: 'exact',
    });
  if (params.object_type) query = query.eq('object_type', params.object_type);
  if (params.action) query = query.eq('action', params.action);

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const rows = data ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const linkFor = (p: number) => {
    const q = new URLSearchParams();
    if (params.object_type) q.set('object_type', params.object_type);
    if (params.action) q.set('action', params.action);
    q.set('page', String(p));
    return `/admin/activity?${q.toString()}`;
  };

  return (
    <DashboardShell role="Admin" name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Activity log</h1>
        <p className="text-sm text-slate-600">
          {total} event{total === 1 ? '' : 's'} recorded across the portal.
        </p>
      </div>

      <form method="get" className="mb-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          type="text"
          name="action"
          defaultValue={params.action ?? ''}
          placeholder="Filter by action (e.g. payment.verified)"
          className="flex-1 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
        />
        <input
          type="text"
          name="object_type"
          defaultValue={params.object_type ?? ''}
          placeholder="Filter by object type (e.g. student)"
          className="flex-1 min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
          No activity recorded yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Object</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const actor = (r as unknown as { actor: { full_name: string } | null }).actor;
                return (
                  <tr key={String(r.id)}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{actor?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.action}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.object_type}
                      {r.object_id ? (
                        <span className="ml-1 font-mono text-[10px] text-slate-400">
                          {String(r.object_id).slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {r.details && Object.keys(r.details as Record<string, unknown>).length > 0 ? (
                        <code className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                          {JSON.stringify(r.details)}
                        </code>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={linkFor(page - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700"
              >
                Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={linkFor(page + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
