'use client';

import { useState } from 'react';
import { IconBookOpen, IconGraduationCap, IconPlus, IconTrash, IconX } from '@/components/icons';
import { EXAM_MONTHS } from '@/lib/students/schema';
import {
  emptyExamScore,
  emptySubject,
  type ExamScore,
  type MonthlyExam,
  type Subject,
} from '@/lib/students/related/schema';

function toInputValue(n: number | null | undefined): string {
  return n == null ? '' : String(n);
}

function fromInputValue(s: string): number | null {
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function SubjectsEditor({ defaultValue }: { defaultValue: Subject[] }) {
  const [subjects, setSubjects] = useState<Subject[]>(defaultValue);

  const updateAt = (index: number, updater: (s: Subject) => Subject) => {
    setSubjects((prev) => prev.map((s, i) => (i === index ? updater(s) : s)));
  };

  const removeAt = (index: number) => {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const addSubject = () => {
    setSubjects((prev) => [...prev, emptySubject()]);
  };

  return (
    <div>
      <input type="hidden" name="subjects_json" value={JSON.stringify(subjects)} />

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Subject performance</p>
        <button
          type="button"
          onClick={addSubject}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Add subject
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
          <IconBookOpen className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-600">
            No subjects added yet. Click &ldquo;Add subject&rdquo; to start.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject, i) => (
            <SubjectCard
              key={i}
              subject={subject}
              onChange={(updater) => updateAt(i, updater)}
              onRemove={() => removeAt(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  onChange,
  onRemove,
}: {
  subject: Subject;
  onChange: (updater: (s: Subject) => Subject) => void;
  onRemove: () => void;
}) {
  const addMonth = () => {
    onChange((s) => ({
      ...s,
      monthly_exams: [...s.monthly_exams, { month: '', ...emptyExamScore() }],
    }));
  };

  const updateMonth = (idx: number, updater: (m: MonthlyExam) => MonthlyExam) => {
    onChange((s) => ({
      ...s,
      monthly_exams: s.monthly_exams.map((m, i) => (i === idx ? updater(m) : m)),
    }));
  };

  const removeMonth = (idx: number) => {
    onChange((s) => ({
      ...s,
      monthly_exams: s.monthly_exams.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-brand-50/40 px-4 py-3">
        <IconBookOpen className="h-4 w-4 text-brand-700" />
        <input
          type="text"
          value={subject.name}
          onChange={(e) => onChange((s) => ({ ...s, name: e.target.value }))}
          placeholder="Subject name (e.g. English)"
          className="flex-1 rounded-lg border border-transparent bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50"
          aria-label="Remove subject"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 p-4">
        {/* Monthly exams */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Monthly exams
            </p>
            <button
              type="button"
              onClick={addMonth}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              <IconPlus className="h-3 w-3" />
              Add month
            </button>
          </div>
          {subject.monthly_exams.length === 0 ? (
            <p className="text-xs text-slate-500">No monthly exams yet.</p>
          ) : (
            <div className="space-y-2">
              {subject.monthly_exams.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <select
                      value={m.month}
                      onChange={(e) =>
                        updateMonth(i, (mm) => ({ ...mm, month: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      <option value="">Select month</option>
                      {EXAM_MONTHS.map((mo) => (
                        <option key={mo} value={mo}>
                          {mo}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMonth(i)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50"
                      aria-label="Remove month"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>
                  <ExamScoreRow
                    value={m}
                    onChange={(next) => updateMonth(i, (mm) => ({ ...mm, ...next }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mid-semester exam */}
        <ExamBlock
          title="Mid Semester Exam"
          icon={IconGraduationCap}
          value={subject.mid_semester ?? emptyExamScore()}
          onChange={(next) => onChange((s) => ({ ...s, mid_semester: next }))}
        />

        {/* Annual exam */}
        <ExamBlock
          title="Annual Exam"
          icon={IconGraduationCap}
          value={subject.annual ?? emptyExamScore()}
          onChange={(next) => onChange((s) => ({ ...s, annual: next }))}
        />

        {/* Teacher assessment */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            Teacher assessment
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AssessmentField
              label="Strengths"
              value={subject.strengths ?? ''}
              onChange={(v) => onChange((s) => ({ ...s, strengths: v || null }))}
            />
            <AssessmentField
              label="Areas for improvement"
              value={subject.areas_for_improvement ?? ''}
              onChange={(v) => onChange((s) => ({ ...s, areas_for_improvement: v || null }))}
            />
          </div>
          <div className="mt-3">
            <AssessmentField
              label="Teacher comments"
              value={subject.teacher_comments ?? ''}
              onChange={(v) => onChange((s) => ({ ...s, teacher_comments: v || null }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamBlock({
  title,
  icon: Icon,
  value,
  onChange,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: ExamScore;
  onChange: (next: ExamScore) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <ExamScoreRow value={value} onChange={onChange} />
    </div>
  );
}

function ExamScoreRow({
  value,
  onChange,
}: {
  value: ExamScore;
  onChange: (next: ExamScore) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <LabelledNumber
        label="Oral total"
        value={value.oral_total}
        onChange={(n) => onChange({ ...value, oral_total: n })}
      />
      <LabelledNumber
        label="Oral obtained"
        value={value.oral_obtained}
        onChange={(n) => onChange({ ...value, oral_obtained: n })}
      />
      <LabelledNumber
        label="Written total"
        value={value.written_total}
        onChange={(n) => onChange({ ...value, written_total: n })}
      />
      <LabelledNumber
        label="Written obtained"
        value={value.written_obtained}
        onChange={(n) => onChange({ ...value, written_obtained: n })}
      />
    </div>
  );
}

function LabelledNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type="number"
        min={0}
        step="any"
        value={toInputValue(value)}
        onChange={(e) => onChange(fromInputValue(e.target.value))}
        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
    </label>
  );
}

function AssessmentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
    </label>
  );
}
