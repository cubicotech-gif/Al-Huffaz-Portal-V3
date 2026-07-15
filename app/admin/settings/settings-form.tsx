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
    bank_name: string | null;
    account_title: string | null;
    account_number: string | null;
    iban: string | null;
    swift_code: string | null;
    payment_instructions: string | null;
    email_notifications_enabled: boolean;
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

      <div className="border-t border-slate-100 pt-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Bank / transfer details</h3>
        <p className="mb-4 text-xs text-slate-500">
          Shown to sponsors on the payment page so they know where to send funds.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Bank name">
            <TextInput name="bank_name" defaultValue={defaults.bank_name ?? ''} />
          </Field>
          <Field label="Account title">
            <TextInput name="account_title" defaultValue={defaults.account_title ?? ''} />
          </Field>
          <Field label="Account number">
            <TextInput name="account_number" defaultValue={defaults.account_number ?? ''} />
          </Field>
          <Field label="IBAN">
            <TextInput name="iban" defaultValue={defaults.iban ?? ''} />
          </Field>
          <Field label="SWIFT / BIC" hint="For international transfers">
            <TextInput name="swift_code" defaultValue={defaults.swift_code ?? ''} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Payment instructions" hint="Any extra notes for sponsors">
            <Textarea
              name="payment_instructions"
              defaultValue={defaults.payment_instructions ?? ''}
            />
          </Field>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Notifications</h3>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="email_notifications_enabled"
            defaultChecked={defaults.email_notifications_enabled}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
          />
          Send email notifications (approvals, payment verifications, re-engagement)
        </label>
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
