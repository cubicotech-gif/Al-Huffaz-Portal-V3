import { signOutAction } from '@/app/auth/signout/actions';
import { IconLogOut } from '@/components/icons';

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
      >
        <IconLogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </form>
  );
}
