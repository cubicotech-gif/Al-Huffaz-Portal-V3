'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, Select, TextInput } from '@/components/form-fields';
import { ACADEMIC_TERMS } from '@/lib/students/schema';
import type { RelatedFormState } from '@/lib/students/related/actions';

const INITIAL: RelatedFormState = {};

type FeeFormAction = (prev: RelatedFormState, formData: FormData) => Promise<RelatedFormState>;

export type FeeDefaults = {
  academic_year: string;
  academic_term: string;
  monthly_fee_major: string;
  course_fee_major: string;
  uniform_fee_major: string;
  annual_fee_major: string;
  admission_fee_major: string;
};

export function FeesForm({
  action,
  submitLabel,
  defaults,
  yearOptions,
}: {
  action: FeeFormAction;
  submitLabel: string;
  defaults: FeeDefaults;
  yearOptions: string[];
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const err = (name: string) => state.fieldErrors?.[name];
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? 'Rs.';

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
          <Select name="academic_term" defaultValue={defaults.academic_term}>
            <option value="">Select Term</option>
            {ACADEMIC_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={`Monthly fee (${symbol})`}>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            name="monthly_fee"
            defaultValue={defaults.monthly_fee_major}
          />
        </Field>
        <Field label={`Course fee (${symbol})`}>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            name="course_fee"
            defaultValue={defaults.course_fee_major}
          />
        </Field>
        <Field label={`Uniform fee (${symbol})`}>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            name="uniform_fee"
            defaultValue={defaults.uniform_fee_major}
          />
        </Field>
        <Field label={`Annual fee (${symbol})`}>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            name="annual_fee"
            defaultValue={defaults.annual_fee_major}
          />
        </Field>
        <Field label={`Admission fee (${symbol})`}>
          <TextInput
            type="number"
            step="0.01"
            min="0"
            name="admission_fee"
            defaultValue={defaults.admission_fee_major}
          />
        </Field>
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

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}
