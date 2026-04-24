import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { approveSponsorAction, rejectSponsorAction } from '@/lib/sponsors/actions';

export const runtime = 'edge';

export default async function PendingSponsorsPage() {
  const { profile } = await requireRole(['admin']);
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from('profiles')
    .select('id, full_name, phone, country, whatsapp, created_at')
    .eq('role', 'pending_sponsor')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const rows = pending ?? [];

  return (
    <DashboardShell role="Admin" name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Pending sponsor approvals</h1>
        <p className="text-sm text-slate-600">{rows.length} account{rows.length === 1 ? '' : 's'} awaiting review.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-600">No pending sponsor registrations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const approve = approveSponsorAction.bind(null, p.id);
            const reject = rejectSponsorAction.bind(null, p.id);
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-slate-900">{p.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {p.country ?? '—'} · {p.phone ?? 'no phone'} · requested{' '}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={reject}>
                    <button
                      type="submit"
                      className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </form>
                  <form action={approve}>
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Approve
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
