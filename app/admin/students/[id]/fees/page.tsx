import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { StudentTabs } from '@/components/student-tabs';
import { formatMinorUnits } from '@/lib/money';
import { deleteFeeAction, saveFeeAction } from '@/lib/students/related/actions';
import { getFee, listFees } from '@/lib/students/related/queries';
import { createClient } from '@/lib/supabase/server';
import { FeesForm, type FeeDefaults } from './fees-form';

export const runtime = 'edge';

const EMPTY: FeeDefaults = {
  academic_year: '',
  academic_term: '',
  monthly_fee_major: '',
  course_fee_major: '',
  uniform_fee_major: '',
  annual_fee_major: '',
  admission_fee_major: '',
};

function toMajor(minor: number | bigint | null | undefined): string {
  if (minor == null) return '';
  const n = typeof minor === 'bigint' ? Number(minor) : minor;
  return String(n / 100);
}

export default async function StudentFeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const { id } = await params;
  const { edit } = await searchParams;

  const supabase = await createClient();
  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, gr_number')
    .eq('id', id)
    .single();
  if (!student) notFound();

  const [rows, editing] = await Promise.all([listFees(id), edit ? getFee(edit) : null]);

  const editingRow = editing && editing.student_id === id ? editing : null;
  const defaults: FeeDefaults = editingRow
    ? {
        academic_year: editingRow.academic_year ?? '',
        academic_term: editingRow.academic_term ?? '',
        monthly_fee_major: toMajor(editingRow.monthly_fee),
        course_fee_major: toMajor(editingRow.course_fee),
        uniform_fee_major: toMajor(editingRow.uniform_fee),
        annual_fee_major: toMajor(editingRow.annual_fee),
        admission_fee_major: toMajor(editingRow.admission_fee),
      }
    : EMPTY;

  const action = saveFeeAction.bind(null, id, editingRow?.id ?? null);

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <div className="mb-4">
        <Link
          href="/admin/students"
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          ← Back to students
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{student.full_name}</h1>
        <p className="text-sm text-slate-600">GR #{student.gr_number ?? '—'} · Fees</p>
      </div>
      <StudentTabs id={id} active="fees" />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          {editingRow ? `Edit ${editingRow.academic_year}${editingRow.academic_term ? ' · ' + editingRow.academic_term : ''}` : 'Add fee record'}
        </h2>
        <FeesForm action={action} defaults={defaults} submitLabel={editingRow ? 'Save changes' : 'Add record'} />
        {editingRow ? (
          <div className="mt-3">
            <Link
              href={`/admin/students/${id}/fees`}
              className="text-xs font-semibold text-slate-600 hover:underline"
            >
              Cancel edit
            </Link>
          </div>
        ) : null}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
        Recorded terms ({rows.length})
      </h2>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          No fee records yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Year · term</th>
                <th className="px-4 py-3">Monthly</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Uniform</th>
                <th className="px-4 py-3">Annual</th>
                <th className="px-4 py-3">Admission</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const del = deleteFeeAction.bind(null, id, r.id);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.academic_year}
                      {r.academic_term ? <span className="text-slate-500"> · {r.academic_term}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatMinorUnits(r.monthly_fee)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMinorUnits(r.course_fee)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMinorUnits(r.uniform_fee)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMinorUnits(r.annual_fee)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMinorUnits(r.admission_fee)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/students/${id}/fees?edit=${r.id}`}
                          className="text-sm font-semibold text-brand-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <form action={del}>
                          <button
                            type="submit"
                            className="text-sm font-semibold text-rose-600 hover:underline"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
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
