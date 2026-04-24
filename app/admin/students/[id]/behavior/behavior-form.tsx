'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, Select, Textarea, TextInput } from '@/components/form-fields';
import { RatingStars } from '@/components/rating-stars';
import { ACADEMIC_TERMS } from '@/lib/students/schema';
import type { RelatedFormState } from '@/lib/students/related/actions';

export type BehaviorDefaults = {
  academic_year: string;
  academic_term: string;
  homework_completion: number | null;
  class_participation: number | null;
  group_work: number | null;
  problem_solving: number | null;
  organization: number | null;
  teacher_comments: string;
  goal_1: string;
  goal_2: string;
  goal_3: string;
};

type Action = (prev: RelatedFormState, formData: FormData) => Promise<RelatedFormState>;
const INITIAL: RelatedFormState = {};

export function BehaviorForm({
  action,
  defaults,
  submitLabel,
  yearOptions,
}: {
  action: Action;
  defaults: BehaviorDefaults;
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

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Behaviour assessment</h3>
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <RatingField
            label="Completes Homework"
            name="homework_completion"
            defaultValue={defaults.homework_completion}
          />
          <RatingField
            label="Class Participation"
            name="class_participation"
            defaultValue={defaults.class_participation}
          />
          <RatingField
            label="Group Work"
            name="group_work"
            defaultValue={defaults.group_work}
          />
          <RatingField
            label="Problem Solving"
            name="problem_solving"
            defaultValue={defaults.problem_solving}
          />
          <RatingField
            label="Organization"
            name="organization"
            defaultValue={defaults.organization}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Goals &amp; comments</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Goal 1">
            <TextInput name="goal_1" defaultValue={defaults.goal_1} />
          </Field>
          <Field label="Goal 2">
            <TextInput name="goal_2" defaultValue={defaults.goal_2} />
          </Field>
          <Field label="Goal 3">
            <TextInput name="goal_3" defaultValue={defaults.goal_3} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Teacher's overall comments">
            <Textarea name="teacher_comments" defaultValue={defaults.teacher_comments} rows={3} />
          </Field>
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

function RatingField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number | null;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-600">{label}</p>
      <RatingStars name={name} defaultValue={defaultValue} />
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}
