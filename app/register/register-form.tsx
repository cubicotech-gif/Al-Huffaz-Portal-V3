'use client';

import { useActionState } from 'react';
import { FieldInput, FieldLabel, FormError, SubmitButton } from '@/components/auth-card';
import { registerAction, type RegisterState } from './actions';

const INITIAL: RegisterState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, INITIAL);

  return (
    <>
      <FormError message={state.error} />
      <form action={action} className="space-y-4">
        <div>
          <FieldLabel htmlFor="full_name">Full name</FieldLabel>
          <FieldInput id="full_name" name="full_name" type="text" autoComplete="name" required />
        </div>
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <FieldInput id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <FieldInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <FieldInput id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div>
            <FieldLabel htmlFor="whatsapp">WhatsApp</FieldLabel>
            <FieldInput id="whatsapp" name="whatsapp" type="tel" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="country">Country</FieldLabel>
          <FieldInput id="country" name="country" type="text" autoComplete="country-name" />
        </div>
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
    </>
  );
}
