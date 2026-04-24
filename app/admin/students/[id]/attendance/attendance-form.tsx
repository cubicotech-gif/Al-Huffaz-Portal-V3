'use client';

import { useActionState, useState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, Select, TextInput } from '@/components/form-fields';
import { ACADEMIC_TERMS } from '@/lib/students/schema';
import type { RelatedFormState } from '@/lib/students/related/actions';

export type AttendanceDefaults = {
  academic_year: string;
  academic_term: string;
  total_school_days: string;
  present_days: string;
};

type Action = (prev: RelatedFormState, formData: FormData) => Promise<RelatedFormState>;
const INITIAL: RelatedFormState = {};

function computePercent(total: string, present: string): number | null {
  const t = Number(total);
  const p = Number(present);
  if (!Number.isFinite(t) || !Number.isFinite(p) || t <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((p / t) * 1000) / 10));
}

export function AttendanceForm({
  action,
  defaults,
  submitLabel,
  yearOptions,
}: {
  action: Action;
  defaults: AttendanceDefaults;
  submitLabel: string;
  yearOptions: string[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [total, setTotal] = useState(defaults.total_school_days);
  const [present, setPresent] = useState(defaults.present_days);
  const percent = computePercent(total, present);
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      {state.savedAt ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Academic year">
          <Select name="academic_year" defaultValue={defaults.academic_year} required>
            <option value="">Select Year</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          {err('academic_year') ? <FieldError message={err('academic_year')!} /> : null}
        </Field>
        <Field label="Term">
          <Select name="academic_term" defaultValue={defaults.academic_term} required>
            <option value="">Select Term</option>
            {ACADEMIC_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          {err('academic_term') ? <FieldError message={err('academic_term')!} /> : null}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3">
        <Field label="Total school days">
          <TextInput
            type="number"
            min={0}
            step={1}
            name="total_school_days"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            required
          />
        </Field>
        <Field label="Present days">
          <TextInput
            type="number"
            min={0}
            step={1}
            name="present_days"
            value={present}
            onChange={(e) => setPresent(e.target.value)}
            required
          />
        </Field>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-600">
            Attendance %
          </p>
          <div className="flex h-[38px] items-center rounded-lg bg-white px-3 text-2xl font-bold">
            <span className={percentToneClass(percent)}>
              {percent == null ? '—' : `${percent}%`}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function percentToneClass(p: number | null): string {
  if (p == null) return 'text-slate-400';
  if (p < 70) return 'text-rose-600';
  if (p < 85) return 'text-amber-600';
  return 'text-emerald-600';
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}
