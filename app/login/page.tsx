import Link from 'next/link';
import { AuthCard } from '@/components/auth-card';
import { LoginForm } from './login-form';

export const runtime = 'edge';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : '';

  return (
    <AuthCard
      title="Sign in"
      subtitle="Admin, staff, and sponsor accounts all sign in here."
      footer={
        <p>
          New sponsor?{' '}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
