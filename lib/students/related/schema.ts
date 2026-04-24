import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable();

// Fees --------------------------------------------------------------------

const minorUnitsFromMajor = z
  .preprocess((v) => {
    if (v === '' || v == null) return 0;
    const n = Number(v);
    if (Number.isNaN(n)) return NaN;
    return Math.round(n * 100);
  }, z.number().int().min(0));

export const feeFormSchema = z.object({
  academic_year: z.string().trim().min(1, 'Academic year is required'),
  academic_term: optionalString,
  monthly_fee: minorUnitsFromMajor,
  course_fee: minorUnitsFromMajor,
  uniform_fee: minorUnitsFromMajor,
  annual_fee: minorUnitsFromMajor,
  admission_fee: minorUnitsFromMajor,
});
export type FeeFormInput = z.infer<typeof feeFormSchema>;

// Academics ---------------------------------------------------------------

// Numbers in exam blocks can be absent. Coerce "" / null / undefined to
// null; anything else must be a finite non-negative number.
const examNumber = z
  .union([z.null(), z.undefined(), z.string(), z.number()])
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  });

export const examScoreSchema = z.object({
  oral_total: examNumber,
  oral_obtained: examNumber,
  written_total: examNumber,
  written_obtained: examNumber,
});
export type ExamScore = z.infer<typeof examScoreSchema>;

export const monthlyExamSchema = examScoreSchema.extend({
  month: z.string().trim().min(1),
});
export type MonthlyExam = z.infer<typeof monthlyExamSchema>;

export const subjectSchema = z.object({
  name: z.string().trim().min(1),
  monthly_exams: z.array(monthlyExamSchema).default([]),
  mid_semester: examScoreSchema.nullable().default(null),
  annual: examScoreSchema.nullable().default(null),
  strengths: z
    .union([z.null(), z.string()])
    .transform((v) => (v == null ? null : v.trim() || null))
    .nullable(),
  areas_for_improvement: z
    .union([z.null(), z.string()])
    .transform((v) => (v == null ? null : v.trim() || null))
    .nullable(),
  teacher_comments: z
    .union([z.null(), z.string()])
    .transform((v) => (v == null ? null : v.trim() || null))
    .nullable(),
});
export type Subject = z.infer<typeof subjectSchema>;

export function emptyExamScore(): ExamScore {
  return { oral_total: null, oral_obtained: null, written_total: null, written_obtained: null };
}

export function emptySubject(): Subject {
  return {
    name: '',
    monthly_exams: [],
    mid_semester: emptyExamScore(),
    annual: emptyExamScore(),
    strengths: null,
    areas_for_improvement: null,
    teacher_comments: null,
  };
}

// Accepts the old {name, marks, total} shape and upgrades it to the new
// rich shape so old edits don't explode. Anything unrecognised becomes
// an empty subject with the original name.
export function coerceSubjectsFromRaw(raw: unknown): Subject[] {
  if (!Array.isArray(raw)) return [];
  const out: Subject[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const parsed = subjectSchema.safeParse(entry);
    if (parsed.success) {
      out.push(parsed.data);
      continue;
    }
    const legacy = entry as { name?: unknown; marks?: unknown; total?: unknown };
    if (typeof legacy.name === 'string' && legacy.name.length > 0) {
      const marks = Number(legacy.marks);
      const total = Number(legacy.total);
      const annual: ExamScore = Number.isFinite(marks) && Number.isFinite(total) && total > 0
        ? {
            oral_total: null,
            oral_obtained: null,
            written_total: total,
            written_obtained: marks,
          }
        : emptyExamScore();
      out.push({
        name: legacy.name,
        monthly_exams: [],
        mid_semester: null,
        annual,
        strengths: null,
        areas_for_improvement: null,
        teacher_comments: null,
      });
    }
  }
  return out;
}

export function subjectTotals(subject: Subject): { obtained: number; total: number } {
  let obtained = 0;
  let total = 0;
  const accumulate = (score: ExamScore | null | undefined) => {
    if (!score) return;
    if (score.oral_total != null && score.oral_obtained != null) {
      total += score.oral_total;
      obtained += score.oral_obtained;
    }
    if (score.written_total != null && score.written_obtained != null) {
      total += score.written_total;
      obtained += score.written_obtained;
    }
  };
  for (const m of subject.monthly_exams ?? []) accumulate(m);
  accumulate(subject.mid_semester);
  accumulate(subject.annual);
  return { obtained, total };
}

export const academicsFormSchema = z
  .object({
    academic_year: z.string().trim().min(1, 'Academic year is required'),
    academic_term: z.string().trim().min(1, 'Term is required'),
    subjects_json: z.string().default('[]'),
    overall_percentage: z
      .preprocess(
        (v) => (v === '' || v == null ? null : Number(v)),
        z.number().min(0).max(100).nullable(),
      ),
  })
  .transform((v, ctx) => {
    let rawSubjects: unknown = [];
    try {
      rawSubjects = JSON.parse(v.subjects_json);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['subjects_json'],
        message: 'Subjects payload is corrupt — refresh and try again.',
      });
      rawSubjects = [];
    }
    if (!Array.isArray(rawSubjects)) rawSubjects = [];
    const subjects: Subject[] = [];
    for (const entry of rawSubjects as unknown[]) {
      const parsed = subjectSchema.safeParse(entry);
      if (parsed.success) {
        if (parsed.data.name.length > 0) subjects.push(parsed.data);
      }
    }
    return {
      academic_year: v.academic_year,
      academic_term: v.academic_term,
      overall_percentage: v.overall_percentage,
      subjects,
    };
  });
export type AcademicsFormInput = z.infer<typeof academicsFormSchema>;

// Behavior ----------------------------------------------------------------

// Ratings are 1-5 stars, stored as smallint per migration 0009.
const optionalStar = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().int().min(1).max(5).nullable(),
);

export const behaviorFormSchema = z
  .object({
    academic_year: z.string().trim().min(1, 'Academic year is required'),
    academic_term: z.string().trim().min(1, 'Term is required'),
    homework_completion: optionalStar,
    class_participation: optionalStar,
    group_work: optionalStar,
    problem_solving: optionalStar,
    organization: optionalStar,
    teacher_comments: optionalString,
    goal_1: optionalString,
    goal_2: optionalString,
    goal_3: optionalString,
  })
  .transform((v) => ({
    academic_year: v.academic_year,
    academic_term: v.academic_term,
    homework_completion: v.homework_completion,
    class_participation: v.class_participation,
    group_work: v.group_work,
    problem_solving: v.problem_solving,
    organization: v.organization,
    teacher_comments: v.teacher_comments,
    goals: [v.goal_1, v.goal_2, v.goal_3].filter(
      (g): g is string => typeof g === 'string' && g.length > 0,
    ),
  }));
export type BehaviorFormInput = z.infer<typeof behaviorFormSchema>;

export function goalsToArray(goals: unknown): string[] {
  if (!Array.isArray(goals)) return [];
  return goals.filter((g): g is string => typeof g === 'string');
}

// Attendance --------------------------------------------------------------

export const attendanceFormSchema = z.object({
  academic_year: z.string().trim().min(1, 'Academic year is required'),
  academic_term: z.string().trim().min(1, 'Term is required'),
  total_school_days: z.preprocess(
    (v) => (v === '' || v == null ? 0 : Number(v)),
    z.number().int().min(0),
  ),
  present_days: z.preprocess(
    (v) => (v === '' || v == null ? 0 : Number(v)),
    z.number().int().min(0),
  ),
});
export type AttendanceFormInput = z.infer<typeof attendanceFormSchema>;
