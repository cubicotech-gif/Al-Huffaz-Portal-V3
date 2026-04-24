'use client';

import { useActionState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, TextInput, Textarea } from '@/components/form-fields';
import { updateSchoolAction, type SettingsState } from './actions';

const INITIAL: SettingsState = {};

export function SettingsForm({
  defaults,
}: {
  defaults: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
    currency_symbol: string;
    academic_year: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateSchoolAction, INITIAL);

  return (
    <form action={action} className="space-y-5">
      <FormError message={state.error} />
      {state.savedAt ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </div>
      ) : null}

      <Field label="School name">
        <TextInput name="name" defaultValue={defaults.name} required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email">
          <TextInput type="email" name="email" defaultValue={defaults.email ?? ''} />
        </Field>
        <Field label="Phone">
          <TextInput name="phone" defaultValue={defaults.phone ?? ''} />
        </Field>
      </div>
      <Field label="Address">
        <Textarea name="address" defaultValue={defaults.address ?? ''} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Currency code">
          <TextInput name="currency" defaultValue={defaults.currency} />
        </Field>
        <Field label="Currency symbol">
          <TextInput name="currency_symbol" defaultValue={defaults.currency_symbol} />
        </Field>
        <Field label="Academic year" hint="e.g. 2025-26">
          <TextInput name="academic_year" defaultValue={defaults.academic_year ?? ''} />
        </Field>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  );
}
