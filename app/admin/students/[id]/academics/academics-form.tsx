'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, Textarea, TextInput } from '@/components/form-fields';
import type { RelatedFormState } from '@/lib/students/related/actions';

export type AcademicsDefaults = {
  academic_year: string;
  academic_term: string;
  overall_percentage: string;
  subjects_text: string;
};

type Action = (prev: RelatedFormState, formData: FormData) => Promise<RelatedFormState>;
const INITIAL: RelatedFormState = {};

export function AcademicsForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults: AcademicsDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      {state.savedAt ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Academic year" hint="e.g. 2025-26">
          <TextInput name="academic_year" defaultValue={defaults.academic_year} required />
          {err('academic_year') ? <FieldError message={err('academic_year')!} /> : null}
        </Field>
        <Field label="Term" hint="Required for academics.">
          <TextInput name="academic_term" defaultValue={defaults.academic_term} required />
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

      <Field label="Subjects" hint="One per line: Subject Name: marks/total (e.g. English: 85/100).">
        <Textarea
          name="subjects_text"
          defaultValue={defaults.subjects_text}
          rows={6}
        />
      </Field>

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
