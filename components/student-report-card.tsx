import { RatingStarsDisplay } from '@/components/rating-stars';
import {
  coerceSubjectsFromRaw,
  goalsToArray,
  subjectTotals,
  type Subject,
} from '@/lib/students/related/schema';
import {
  gradeLetter,
  overallFromSubjects,
  subjectPercentage,
} from '@/lib/students/related/grades';

// Read-only academic report card, shared by the admin student profile and the
// sponsor-facing "my student → progress" view. Takes the latest per-term rows
// already loaded by the caller.

type AcademicsRow = {
  id: string;
  academic_year: string;
  academic_term: string;
  subjects: unknown;
  overall_percentage: number | null;
} | null;

type AttendanceRow = {
  academic_year: string;
  academic_term: string;
  total_school_days: number | null;
  present_days: number | null;
} | null;

type BehaviorRow = {
  academic_year: string;
  academic_term: string;
  homework_completion: number | null;
  class_participation: number | null;
  group_work: number | null;
  problem_solving: number | null;
  organization: number | null;
  teacher_comments: string | null;
  goals: unknown;
} | null;

export function StudentReportCard({
  academics,
  attendance,
  behavior,
}: {
  academics: AcademicsRow;
  attendance: AttendanceRow;
  behavior: BehaviorRow;
}) {
  if (!academics && !attendance && !behavior) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        No academic records have been published yet. Please check back later.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {academics ? <AcademicsSection academics={academics} /> : null}
      {attendance ? <AttendanceSection attendance={attendance} /> : null}
      {behavior ? <BehaviorSection behavior={behavior} /> : null}
    </div>
  );
}

function AcademicsSection({ academics }: { academics: NonNullable<AcademicsRow> }) {
  const subjects = coerceSubjectsFromRaw(academics.subjects);
  const computed = overallFromSubjects(subjects);
  const overall = academics.overall_percentage ?? computed.percentage;
  const overallGrade = gradeLetter(overall);

  return (
    <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeading
        title="Report card"
        suffix={`${academics.academic_year} · ${academics.academic_term}`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Overall
          </p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900">
            {overall != null ? `${overall}%` : '—'}
          </p>
        </div>
        {overallGrade ? (
          <div className="rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-brand-600">
              Grade
            </p>
            <p className="mt-0.5 text-2xl font-bold text-brand-700">{overallGrade}</p>
          </div>
        ) : null}
      </div>

      {subjects.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Marks</th>
                <th className="px-3 py-2">%</th>
                <th className="px-3 py-2">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s, i) => (
                <SubjectRow key={`${academics.id}-${i}`} subject={s} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No subjects recorded for this term.</p>
      )}

      {subjects.some((s) => s.teacher_comments) ? (
        <div className="mt-4 space-y-2">
          {subjects
            .filter((s) => s.teacher_comments)
            .map((s, i) => (
              <div key={`comment-${i}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {s.name} — teacher comments
                </p>
                <p className="mt-0.5 text-slate-700">{s.teacher_comments}</p>
              </div>
            ))}
        </div>
      ) : null}
    </section>
  );
}

function SubjectRow({ subject }: { subject: Subject }) {
  const { obtained, total } = subjectTotals(subject);
  const pct = subjectPercentage(subject);
  const grade = gradeLetter(pct);
  return (
    <tr>
      <td className="px-3 py-2 font-medium text-slate-800">{subject.name || 'Unnamed subject'}</td>
      <td className="px-3 py-2 text-slate-600">{total > 0 ? `${obtained} / ${total}` : '—'}</td>
      <td className="px-3 py-2 text-slate-600">{pct != null ? `${pct}%` : '—'}</td>
      <td className="px-3 py-2">
        {grade ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
            {grade}
          </span>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}

function AttendanceSection({ attendance }: { attendance: NonNullable<AttendanceRow> }) {
  const total = Number(attendance.total_school_days ?? 0);
  const present = Number(attendance.present_days ?? 0);
  const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : null;
  const tone =
    pct == null
      ? 'text-slate-500'
      : pct < 70
        ? 'text-rose-600'
        : pct < 85
          ? 'text-amber-600'
          : 'text-emerald-600';
  return (
    <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeading
        title="Attendance"
        suffix={`${attendance.academic_year} · ${attendance.academic_term}`}
      />
      <div className="grid grid-cols-3 gap-4 text-sm">
        <Field label="Total school days" value={String(total)} />
        <Field label="Present days" value={String(present)} />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Attendance
          </p>
          <p className={`mt-0.5 text-xl font-bold ${tone}`}>{pct == null ? '—' : `${pct}%`}</p>
        </div>
      </div>
    </section>
  );
}

function BehaviorSection({ behavior }: { behavior: NonNullable<BehaviorRow> }) {
  const goals = goalsToArray(behavior.goals);
  return (
    <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeading
        title="Behaviour"
        suffix={`${behavior.academic_year} · ${behavior.academic_term}`}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RatingDisplay label="Homework" value={behavior.homework_completion} />
        <RatingDisplay label="Class participation" value={behavior.class_participation} />
        <RatingDisplay label="Group work" value={behavior.group_work} />
        <RatingDisplay label="Problem solving" value={behavior.problem_solving} />
        <RatingDisplay label="Organization" value={behavior.organization} />
      </div>
      {behavior.teacher_comments ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Teacher comments
          </p>
          {behavior.teacher_comments}
        </div>
      ) : null}
      {goals.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {goals.slice(0, 3).map((g, i) => (
            <div key={`goal-${i}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Goal {i + 1}
              </p>
              {g}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RatingDisplay({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <RatingStarsDisplay value={value ?? null} />
        {value != null ? <span className="text-xs text-slate-500">{value}/5</span> : null}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function SectionHeading({ title, suffix }: { title: string; suffix?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">{title}</h2>
      {suffix ? <span className="text-xs text-slate-500">{suffix}</span> : null}
    </div>
  );
}
