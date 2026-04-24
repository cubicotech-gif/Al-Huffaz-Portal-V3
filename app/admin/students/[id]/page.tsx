import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { StudentTabs } from '@/components/student-tabs';
import { PrintButton } from '@/components/print-button';
import { RatingStarsDisplay } from '@/components/rating-stars';
import { formatMinorUnits } from '@/lib/money';
import { getStudentById, signedPhotoUrl } from '@/lib/students/queries';
import {
  listAcademics,
  listAttendance,
  listBehavior,
  listFees,
} from '@/lib/students/related/queries';
import { goalsToArray } from '@/lib/students/related/schema';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const { id } = await params;

  const student = await getStudentById(id);
  if (!student) notFound();

  const [photo, fees, academics, behavior, attendance, school, sponsorships] = await Promise.all([
    signedPhotoUrl(student.photo_url),
    listFees(id),
    listAcademics(id),
    listBehavior(id),
    listAttendance(id),
    (await createClient())
      .from('schools')
      .select('name, academic_year, currency_symbol')
      .eq('id', student.school_id)
      .single()
      .then((r) => r.data),
    (await createClient())
      .from('sponsorships')
      .select('id, status, monthly_amount, approved_at, sponsor:sponsors(display_name, email)')
      .eq('student_id', id)
      .in('status', ['approved', 'active', 'paused'])
      .order('approved_at', { ascending: false })
      .then((r) => r.data ?? []),
  ]);

  const latestFee = fees[0] ?? null;
  const latestAcademics = academics[0] ?? null;
  const latestBehavior = behavior[0] ?? null;
  const latestAttendance = attendance[0] ?? null;

  return (
    <DashboardShell
      role={profile.role === 'admin' ? 'Admin' : 'Staff'}
      name={profile.full_name}
      notificationsHref="/admin/notifications"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <Link
            href="/admin/students"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            ← Back to students
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{student.full_name}</h1>
          <p className="text-sm text-slate-600">
            {student.archived_at ? 'Archived' : 'Active'} · GR #{student.gr_number ?? '—'}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <Link
            href={`/admin/students/${id}/edit`}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="no-print">
        <StudentTabs id={id} active="" />
      </div>

      {/* Print header (hidden on screen, shown on print) */}
      <div className="hidden border-b border-slate-300 pb-3 text-center print:block">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">
          {school?.name ?? 'Al-Huffaz Islamic School'}
        </p>
        <p className="text-xs text-slate-600">Student Profile</p>
      </div>

      <div className="space-y-6">
        {/* Header card */}
        <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row">
            {photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photo}
                alt={student.full_name}
                className="h-32 w-32 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                No photo
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{student.full_name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {student.grade_level ?? 'Grade —'} ·{' '}
                {student.islamic_category && student.islamic_category !== 'none'
                  ? student.islamic_category
                  : 'Academic'}
                {student.gender ? ` · ${student.gender}` : ''}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Field label="GR number" value={student.gr_number} />
                <Field label="Roll number" value={student.roll_number} />
                <Field label="Date of birth" value={formatDate(student.date_of_birth)} />
                <Field label="Admission date" value={formatDate(student.admission_date)} />
                <Field label="Islamic category" value={student.islamic_category} />
                <Field label="Status" value={statusLabel(student)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {student.donation_eligible ? <Pill color="emerald">Donation eligible</Pill> : null}
                {student.zakat_eligible ? <Pill color="amber">Zakat eligible</Pill> : null}
                {student.is_sponsored ? <Pill color="brand">Sponsored</Pill> : null}
                {student.archived_at ? <Pill color="slate">Archived</Pill> : null}
              </div>
            </div>
          </div>
        </section>

        {/* Address */}
        {(student.permanent_address || student.current_address) ? (
          <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading title="Address" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Permanent" value={student.permanent_address} multiline />
              <Field label="Current" value={student.current_address} multiline />
            </div>
          </section>
        ) : null}

        {/* Family */}
        <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading title="Family & guardians" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Father's name" value={student.father_name} />
            <Field label="Father CNIC" value={student.father_cnic} />
            <Field label="Father email" value={student.father_email} />
            <Field label="Guardian's name" value={student.guardian_name} />
            <Field label="Relationship" value={student.relationship} />
            <Field label="Guardian CNIC" value={student.guardian_cnic} />
            <Field label="Guardian phone" value={student.guardian_phone} />
            <Field label="Guardian WhatsApp" value={student.guardian_whatsapp} />
            <Field label="Guardian email" value={student.guardian_email} />
            <Field label="Emergency contact" value={student.emergency_contact} />
            <Field label="Emergency WhatsApp" value={student.emergency_whatsapp} />
          </div>
        </section>

        {/* Health */}
        <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionHeading title="Health" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Blood group" value={student.blood_group} />
            <Field label="Health rating" value={ratingOrDash(student.health_rating)} />
            <Field label="Cleanness rating" value={ratingOrDash(student.cleanness_rating)} />
            <Field label="Allergies" value={student.allergies} multiline />
            <Field label="Medical conditions" value={student.medical_conditions} multiline />
          </div>
        </section>

        {/* Sponsorships */}
        {sponsorships.length > 0 ? (
          <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading title="Active sponsorships" />
            <div className="divide-y divide-slate-100">
              {sponsorships.map((s) => {
                const sp = (s as unknown as { sponsor: { display_name: string; email: string } | null }).sponsor;
                return (
                  <div key={s.id as string} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{sp?.display_name ?? '—'}</p>
                      <p className="text-xs text-slate-500">{sp?.email ?? ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">
                        {formatMinorUnits(s.monthly_amount as number)}/month
                      </p>
                      <p className="text-xs capitalize text-slate-500">{s.status as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Latest fees */}
        {latestFee ? (
          <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading
              title="Latest fees"
              suffix={`${latestFee.academic_year}${latestFee.academic_term ? ' · ' + latestFee.academic_term : ''}`}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Field label="Monthly" value={formatMinorUnits(latestFee.monthly_fee)} />
              <Field label="Course" value={formatMinorUnits(latestFee.course_fee)} />
              <Field label="Uniform" value={formatMinorUnits(latestFee.uniform_fee)} />
              <Field label="Annual" value={formatMinorUnits(latestFee.annual_fee)} />
              <Field label="Admission" value={formatMinorUnits(latestFee.admission_fee)} />
            </div>
          </section>
        ) : null}

        {/* Latest academics */}
        {latestAcademics ? (
          <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeading
              title="Latest academics"
              suffix={`${latestAcademics.academic_year} · ${latestAcademics.academic_term}`}
            />
            <p className="mb-3 text-sm text-slate-600">
              Overall:{' '}
              <span className="font-semibold text-slate-900">
                {latestAcademics.overall_percentage != null
                  ? `${latestAcademics.overall_percentage}%`
                  : '—'}
              </span>
            </p>
            {Array.isArray(latestAcademics.subjects) && latestAcademics.subjects.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(latestAcademics.subjects as Array<{ name: string; marks: number; total: number }>).map((s) => (
                  <div key={s.name} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-600">
                      {s.marks} / {s.total}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Latest attendance */}
        {latestAttendance ? (() => {
          const total = Number(latestAttendance.total_school_days ?? 0);
          const present = Number(latestAttendance.present_days ?? 0);
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
                title="Latest attendance"
                suffix={`${latestAttendance.academic_year} · ${latestAttendance.academic_term}`}
              />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <Field label="Total school days" value={String(total)} />
                <Field label="Present days" value={String(present)} />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Attendance
                  </p>
                  <p className={`mt-0.5 text-xl font-bold ${tone}`}>
                    {pct == null ? '—' : `${pct}%`}
                  </p>
                </div>
              </div>
            </section>
          );
        })() : null}

        {/* Latest behaviour */}
        {latestBehavior ? (() => {
          const goals = goalsToArray(latestBehavior.goals);
          return (
            <section className="print-card rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading
                title="Latest behaviour"
                suffix={`${latestBehavior.academic_year} · ${latestBehavior.academic_term}`}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <RatingDisplay label="Homework" value={latestBehavior.homework_completion} />
                <RatingDisplay
                  label="Class participation"
                  value={latestBehavior.class_participation}
                />
                <RatingDisplay label="Group work" value={latestBehavior.group_work} />
                <RatingDisplay label="Problem solving" value={latestBehavior.problem_solving} />
                <RatingDisplay label="Organization" value={latestBehavior.organization} />
              </div>
              {latestBehavior.teacher_comments ? (
                <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Teacher comments
                  </p>
                  {latestBehavior.teacher_comments}
                </div>
              ) : null}
              {goals.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {goals.slice(0, 3).map((g, i) => (
                    <div
                      key={`goal-${i}`}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
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
        })() : null}
      </div>
    </DashboardShell>
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

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function statusLabel(student: { archived_at: string | null; is_sponsored: boolean; donation_eligible: boolean }) {
  if (student.archived_at) return 'Archived';
  if (student.is_sponsored) return 'Sponsored';
  if (student.donation_eligible) return 'Available for sponsorship';
  return 'Active';
}

function ratingOrDash(n: number | null | undefined): string | null {
  if (n == null) return null;
  return `${n} / 5`;
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm text-slate-800 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value || '—'}
      </p>
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

function Pill({ color, children }: { color: 'emerald' | 'amber' | 'brand' | 'slate'; children: React.ReactNode }) {
  const map = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    brand: 'bg-brand-100 text-brand-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[color]}`}>{children}</span>
  );
}
