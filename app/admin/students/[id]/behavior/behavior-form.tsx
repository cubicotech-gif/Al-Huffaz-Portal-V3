'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, Select, Textarea, TextInput } from '@/components/form-fields';
import type { RelatedFormState } from '@/lib/students/related/actions';
import { BEHAVIOR_RATINGS } from '@/lib/students/related/schema';

export type BehaviorDefaults = {
  academic_year: string;
  academic_term: string;
  homework_completion: string;
  class_participation: string;
  group_work: string;
  problem_solving: string;
  organization: string;
  teacher_comments: string;
  goals_text: string;
};

type Action = (prev: RelatedFormState, formData: FormData) => Promise<RelatedFormState>;
const INITIAL: RelatedFormState = {};

function RatingSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <option value="">—</option>
      {BEHAVIOR_RATINGS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </Select>
  );
}

export function BehaviorForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults: BehaviorDefaults;
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Academic year" hint="e.g. 2025-26">
          <TextInput name="academic_year" defaultValue={defaults.academic_year} required />
          {err('academic_year') ? <FieldError message={err('academic_year')!} /> : null}
        </Field>
        <Field label="Term">
          <TextInput name="academic_term" defaultValue={defaults.academic_term} required />
          {err('academic_term') ? <FieldError message={err('academic_term')!} /> : null}
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Homework completion">
          <RatingSelect name="homework_completion" defaultValue={defaults.homework_completion} />
        </Field>
        <Field label="Class participation">
          <RatingSelect name="class_participation" defaultValue={defaults.class_participation} />
        </Field>
        <Field label="Group work">
          <RatingSelect name="group_work" defaultValue={defaults.group_work} />
        </Field>
        <Field label="Problem solving">
          <RatingSelect name="problem_solving" defaultValue={defaults.problem_solving} />
        </Field>
        <Field label="Organization">
          <RatingSelect name="organization" defaultValue={defaults.organization} />
        </Field>
      </div>

      <Field label="Teacher comments">
        <Textarea name="teacher_comments" defaultValue={defaults.teacher_comments} rows={3} />
      </Field>

      <Field label="Goals" hint="One goal per line.">
        <Textarea name="goals_text" defaultValue={defaults.goals_text} rows={4} />
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
