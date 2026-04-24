'use client';

import { useActionState } from 'react';
import { FieldInput, FieldLabel, FormError, SubmitButton } from '@/components/auth-card';
import { loginAction, type LoginState } from './actions';

const INITIAL: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, INITIAL);

  return (
    <>
      <FormError message={state.error} />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton pending={pending}>Sign in</SubmitButton>
      </form>
    </>
  );
}
