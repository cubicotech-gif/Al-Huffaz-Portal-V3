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

const subjectRow = z.object({
  name: z.string().trim().min(1),
  marks: z.number().finite(),
  total: z.number().positive(),
});
export type SubjectRow = z.infer<typeof subjectRow>;

// Input format: one subject per line, "Subject Name: marks/total"
// Empty lines and lines without a colon are ignored.
function parseSubjectsString(input: string): SubjectRow[] {
  const lines = input.split(/\r?\n/);
  const rows: SubjectRow[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const name = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();
    const [marksStr, totalStr] = rest.split('/').map((s) => s.trim());
    const marks = Number(marksStr);
    const total = Number(totalStr ?? '100');
    if (!name || Number.isNaN(marks) || Number.isNaN(total) || total <= 0) continue;
    rows.push({ name, marks, total });
  }
  return rows;
}

export function subjectsToString(rows: SubjectRow[]): string {
  return rows.map((r) => `${r.name}: ${r.marks}/${r.total}`).join('\n');
}

export const academicsFormSchema = z
  .object({
    academic_year: z.string().trim().min(1, 'Academic year is required'),
    academic_term: z.string().trim().min(1, 'Term is required'),
    subjects_text: z.string().default(''),
    overall_percentage: z
      .preprocess(
        (v) => (v === '' || v == null ? null : Number(v)),
        z.number().min(0).max(100).nullable(),
      ),
  })
  .transform((v) => ({
    academic_year: v.academic_year,
    academic_term: v.academic_term,
    overall_percentage: v.overall_percentage,
    subjects: parseSubjectsString(v.subjects_text),
  }));
export type AcademicsFormInput = z.infer<typeof academicsFormSchema>;

// Behavior ----------------------------------------------------------------

export const BEHAVIOR_RATINGS = [
  'Excellent',
  'Very good',
  'Good',
  'Satisfactory',
  'Needs improvement',
  'Unsatisfactory',
] as const;

export const behaviorFormSchema = z
  .object({
    academic_year: z.string().trim().min(1, 'Academic year is required'),
    academic_term: z.string().trim().min(1, 'Term is required'),
    homework_completion: optionalString,
    class_participation: optionalString,
    group_work: optionalString,
    problem_solving: optionalString,
    organization: optionalString,
    teacher_comments: optionalString,
    goals_text: z.string().default(''),
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
    goals: v.goals_text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  }));
export type BehaviorFormInput = z.infer<typeof behaviorFormSchema>;

export function goalsToString(goals: unknown): string {
  if (!Array.isArray(goals)) return '';
  return goals.filter((g) => typeof g === 'string').join('\n');
}
