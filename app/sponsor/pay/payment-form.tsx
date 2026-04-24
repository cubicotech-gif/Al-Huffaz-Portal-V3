'use client';

import { useActionState, useState } from 'react';
import { FormError } from '@/components/auth-card';
import { Field, Select, Textarea, TextInput } from '@/components/form-fields';
import { PAYMENT_METHODS } from '@/lib/payments/schema';
import { submitPaymentAction, type PaymentFormState } from '@/lib/payments/actions';

type Sponsorship = {
  id: string;
  monthly_amount: number | string;
  student_name: string | null;
  status: string;
};

const INITIAL: PaymentFormState = {};

export function PaymentForm({
  sponsorships,
  initialSponsorshipId,
}: {
  sponsorships: Sponsorship[];
  initialSponsorshipId?: string;
}) {
  const [state, action, pending] = useActionState(submitPaymentAction, INITIAL);
  const [sponsorshipId, setSponsorshipId] = useState(
    initialSponsorshipId && sponsorships.some((s) => s.id === initialSponsorshipId)
      ? initialSponsorshipId
      : sponsorships[0]?.id ?? '',
  );

  const selected = sponsorships.find((s) => s.id === sponsorshipId);
  const err = (name: string) => state.fieldErrors?.[name];

  const today = new Date().toISOString().slice(0, 10);
  const suggestedAmount = selected ? Number(selected.monthly_amount ?? 0) / 100 : '';

  if (sponsorships.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        You don't have any active sponsorships yet. Once a request is approved by an administrator
        you can submit payments here.
      </div>
    );
  }

  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      <FormError message={state.error} />

      <Field label="Sponsorship">
        <Select
          name="sponsorship_id"
          value={sponsorshipId}
          onChange={(e) => setSponsorshipId(e.target.value)}
          required
        >
          {sponsorships.map((s) => (
            <option key={s.id} value={s.id}>
              {s.student_name ?? 'Student'} — {s.status}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Amount (PKR)" hint="Enter in rupees — we store paise internally.">
          <TextInput
            type="number"
            step="0.01"
            min="1"
            name="amount_major"
            defaultValue={suggestedAmount === '' ? '' : String(suggestedAmount)}
            required
          />
          {err('amount_major') ? <FieldError message={err('amount_major')!} /> : null}
        </Field>
        <Field label="Payment method">
          <Select name="payment_method" defaultValue="bank_transfer" required>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Bank / wallet name">
          <TextInput name="bank_name" placeholder="e.g. HBL, JazzCash" />
        </Field>
        <Field label="Transaction ID / reference">
          <TextInput name="transaction_id" />
        </Field>
        <Field label="Payment date">
          <TextInput type="date" name="payment_date" defaultValue={today} max={today} required />
          {err('payment_date') ? <FieldError message={err('payment_date')!} /> : null}
        </Field>
      </div>

      <Field label="Notes">
        <Textarea name="notes" rows={3} />
      </Field>

      <Field label="Proof of payment" hint="Screenshot or PDF. Max 5 MB.">
        <input
          type="file"
          name="proof"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Submit payment for review'}
      </button>
    </form>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}
