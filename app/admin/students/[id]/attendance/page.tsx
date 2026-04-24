import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { StudentTabs } from '@/components/student-tabs';
import { createClient } from '@/lib/supabase/server';
import {
  deleteAttendanceAction,
  saveAttendanceAction,
} from '@/lib/students/related/actions';
import { getAttendance, listAttendance } from '@/lib/students/related/queries';
import { academicYearOptions } from '@/lib/students/schema';
import { AttendanceForm, type AttendanceDefaults } from './attendance-form';

export const runtime = 'edge';

const EMPTY: AttendanceDefaults = {
  academic_year: '',
  academic_term: '',
  total_school_days: '',
  present_days: '',
};

function percent(total: number, present: number): number | null {
  if (total <= 0) return null;
  return Math.round((present / total) * 1000) / 10;
}

export default async function StudentAttendancePage({
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

  const [rows, editing, { data: school }] = await Promise.all([
    listAttendance(id),
    edit ? getAttendance(edit) : null,
    supabase.from('schools').select('academic_year').limit(1).single(),
  ]);
  const yearOptions = academicYearOptions(school?.academic_year ?? null);
  const editingRow = editing && editing.student_id === id ? editing : null;

  const defaults: AttendanceDefaults = editingRow
    ? {
        academic_year: editingRow.academic_year ?? '',
        academic_term: editingRow.academic_term ?? '',
        total_school_days: String(editingRow.total_school_days ?? ''),
        present_days: String(editingRow.present_days ?? ''),
      }
    : EMPTY;

  const action = saveAttendanceAction.bind(null, id, editingRow?.id ?? null);

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
        <p className="text-sm text-slate-600">GR #{student.gr_number ?? '—'} · Attendance</p>
      </div>
      <StudentTabs id={id} active="attendance" />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          {editingRow
            ? `Edit ${editingRow.academic_year} · ${editingRow.academic_term}`
            : 'Add attendance record'}
        </h2>
        <AttendanceForm
          action={action}
          defaults={defaults}
          submitLabel={editingRow ? 'Save changes' : 'Add record'}
          yearOptions={yearOptions}
        />
        {editingRow ? (
          <div className="mt-3">
            <Link
              href={`/admin/students/${id}/attendance`}
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
          No attendance records yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Year · term</th>
                <th className="px-4 py-3">Total days</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const pct = percent(Number(r.total_school_days ?? 0), Number(r.present_days ?? 0));
                const tone = pct == null ? 'text-slate-400' : pct < 70 ? 'text-rose-600' : pct < 85 ? 'text-amber-600' : 'text-emerald-600';
                const del = deleteAttendanceAction.bind(null, id, r.id);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.academic_year}
                      {r.academic_term ? <span className="text-slate-500"> · {r.academic_term}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.total_school_days}</td>
                    <td className="px-4 py-3 text-slate-700">{r.present_days}</td>
                    <td className={`px-4 py-3 font-semibold ${tone}`}>
                      {pct == null ? '—' : `${pct}%`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/students/${id}/attendance?edit=${r.id}`}
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
