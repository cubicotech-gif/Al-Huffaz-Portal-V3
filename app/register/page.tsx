import Link from 'next/link';
import { AuthCard } from '@/components/auth-card';
import { RegisterForm } from './register-form';

export const runtime = 'edge';

export default function RegisterPage() {
  return (
    <AuthCard
      title="Become a sponsor"
      subtitle="Create your account. An administrator will review and approve it before you can sponsor a student."
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
