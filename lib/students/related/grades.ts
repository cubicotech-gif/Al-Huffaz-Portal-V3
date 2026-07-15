// Grade + percentage computation shared by the admin report card and the
// sponsor-facing progress view. v2 displayed a grade letter but never wrote
// one — v3 computes it from marks so display stays consistent everywhere.

import { subjectTotals, type ExamScore, type Subject } from '@/lib/students/related/schema';

// Marks bands per the v2 report card: A+ >=90, A >=80, B >=70, C >=60,
// D >=50, else F. `null` percentage (no marks entered) yields no grade.
export function gradeLetter(percentage: number | null | undefined): string | null {
  if (percentage == null || Number.isNaN(percentage)) return null;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Percentage for a single exam block (oral + written combined). Returns null
// when no scorable marks are present.
export function examPercentage(score: ExamScore | null | undefined): number | null {
  if (!score) return null;
  let obtained = 0;
  let total = 0;
  if (score.oral_total != null && score.oral_obtained != null) {
    total += score.oral_total;
    obtained += score.oral_obtained;
  }
  if (score.written_total != null && score.written_obtained != null) {
    total += score.written_total;
    obtained += score.written_obtained;
  }
  if (total <= 0) return null;
  return round2((obtained / total) * 100);
}

// Percentage across every exam in a subject (monthly + mid + annual).
export function subjectPercentage(subject: Subject): number | null {
  const { obtained, total } = subjectTotals(subject);
  if (total <= 0) return null;
  return round2((obtained / total) * 100);
}

// Student-level overall across all subjects, aggregating raw marks (not an
// average of per-subject percentages, so a subject with more marks weighs
// proportionally — matching how a real transcript totals up).
export function overallFromSubjects(
  subjects: Subject[],
): { obtained: number; total: number; percentage: number | null } {
  let obtained = 0;
  let total = 0;
  for (const subject of subjects) {
    const t = subjectTotals(subject);
    obtained += t.obtained;
    total += t.total;
  }
  return {
    obtained,
    total,
    percentage: total > 0 ? round2((obtained / total) * 100) : null,
  };
}
