import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { StudentTabs } from '@/components/student-tabs';
import { createClient } from '@/lib/supabase/server';
import { deleteAcademicsAction, saveAcademicsAction } from '@/lib/students/related/actions';
import { getAcademics, listAcademics } from '@/lib/students/related/queries';
import {
  coerceSubjectsFromRaw,
  subjectTotals,
  type Subject,
} from '@/lib/students/related/schema';
import { academicYearOptions } from '@/lib/students/schema';
import { AcademicsForm, type AcademicsDefaults } from './academics-form';

export const runtime = 'edge';

const EMPTY: AcademicsDefaults = {
  academic_year: '',
  academic_term: '',
  overall_percentage: '',
  subjects: [],
};

export default async function StudentAcademicsPage({
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
    listAcademics(id),
    edit ? getAcademics(edit) : null,
    supabase.from('schools').select('academic_year').limit(1).single(),
  ]);
  const yearOptions = academicYearOptions(school?.academic_year ?? null);
  const editingRow = editing && editing.student_id === id ? editing : null;

  const defaults: AcademicsDefaults = editingRow
    ? {
        academic_year: editingRow.academic_year ?? '',
        academic_term: editingRow.academic_term ?? '',
        overall_percentage:
          editingRow.overall_percentage == null ? '' : String(editingRow.overall_percentage),
        subjects: coerceSubjectsFromRaw(editingRow.subjects),
      }
    : EMPTY;

  const action = saveAcademicsAction.bind(null, id, editingRow?.id ?? null);

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
        <p className="text-sm text-slate-600">GR #{student.gr_number ?? '—'} · Academics</p>
      </div>
      <StudentTabs id={id} active="academics" />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600">
          {editingRow
            ? `Edit ${editingRow.academic_year} · ${editingRow.academic_term}`
            : 'Add academics record'}
        </h2>
        <AcademicsForm
          action={action}
          defaults={defaults}
          submitLabel={editingRow ? 'Save changes' : 'Add record'}
          yearOptions={yearOptions}
        />
        {editingRow ? (
          <div className="mt-3">
            <Link
              href={`/admin/students/${id}/academics`}
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
          No academics records yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const subjects = coerceSubjectsFromRaw(r.subjects);
            const del = deleteAcademicsAction.bind(null, id, r.id);
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {r.academic_year} · {r.academic_term}
                    </p>
                    <p className="text-xs text-slate-500">
                      Overall:{' '}
                      {r.overall_percentage != null ? `${r.overall_percentage}%` : '—'} ·{' '}
                      {subjects.length} subject{subjects.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/students/${id}/academics?edit=${r.id}`}
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
                </div>
                {subjects.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((s, i) => (
                      <SubjectSummaryCard key={`${r.id}-${i}`} subject={s} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No subjects recorded.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

function SubjectSummaryCard({ subject }: { subject: Subject }) {
  const { obtained, total } = subjectTotals(subject);
  const pct = total > 0 ? Math.round((obtained / total) * 1000) / 10 : null;
  const monthsCount = subject.monthly_exams.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm">
      <p className="font-semibold text-slate-900">{subject.name || 'Unnamed subject'}</p>
      <p className="mt-0.5 text-xs text-slate-600">
        {total > 0 ? `${obtained} / ${total}` : 'No marks entered'}
        {pct != null ? ` · ${pct}%` : ''}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-500">
        {monthsCount} monthly · mid-sem{subject.mid_semester ? ' ✓' : ' —'} · annual
        {subject.annual ? ' ✓' : ' —'}
      </p>
    </div>
  );
}
