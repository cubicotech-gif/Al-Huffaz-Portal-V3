import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { createClient } from '@/lib/supabase/server';
import { revokeStaffAction } from '@/lib/staff/actions';
import { GrantStaffForm } from './staff-form';

export const runtime = 'edge';

export default async function StaffPage() {
  const { profile } = await requireRole(['admin']);
  const supabase = await createClient();

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, phone, country, is_active, approved_at, created_at')
    .eq('role', 'staff')
    .order('created_at', { ascending: false });

  const rows = data ?? [];

  return (
    <DashboardShell role="Admin" name={profile.full_name} notificationsHref="/admin/notifications">
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Staff</h1>
        <p className="text-sm text-slate-600">
          Staff can manage students but cannot approve sponsors or verify payments.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          Grant staff role
        </h2>
        <GrantStaffForm />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
        Current staff ({rows.filter((r) => r.is_active).length})
      </h2>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
          No staff accounts yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const revoke = revokeStaffAction.bind(null, r.id);
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.country ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          r.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.is_active ? (
                        <form action={revoke}>
                          <button
                            type="submit"
                            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Revoke
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-400">revoked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
