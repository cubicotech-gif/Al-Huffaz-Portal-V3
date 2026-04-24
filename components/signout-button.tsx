import { signOutAction } from '@/app/auth/signout/actions';

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="text-sm font-semibold text-brand-600 hover:underline">
        Sign out
      </button>
    </form>
  );
}
