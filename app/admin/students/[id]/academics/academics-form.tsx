'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, Select, TextInput } from '@/components/form-fields';
import { SubjectsEditor } from '@/components/subjects-editor';
import { ACADEMIC_TERMS } from '@/lib/students/schema';
import type { Subject } from '@/lib/students/related/schema';
import type { RelatedFormState } from '@/lib/students/related/actions';

export type AcademicsDefaults = {
  academic_year: string;
  academic_term: string;
  overall_percentage: string;
  subjects: Subject[];
};

type Action = (prev: RelatedFormState, formData: FormData) => Promise<RelatedFormState>;
const INITIAL: RelatedFormState = {};

export function AcademicsForm({
  action,
  defaults,
  submitLabel,
  yearOptions,
}: {
  action: Action;
  defaults: AcademicsDefaults;
  submitLabel: string;
  yearOptions: string[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />
      {state.savedAt ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <Field label="Overall %" hint="0–100, optional.">
          <TextInput
            type="number"
            step="0.01"
            min="0"
            max="100"
            name="overall_percentage"
            defaultValue={defaults.overall_percentage}
          />
        </Field>
      </div>

      <SubjectsEditor defaultValue={defaults.subjects} />

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

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}
