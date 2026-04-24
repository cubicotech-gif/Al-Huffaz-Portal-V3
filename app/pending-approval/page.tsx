import { requireRole } from '@/lib/auth';
import { AuthCard } from '@/components/auth-card';
import { SignOutButton } from '@/components/signout-button';

export const runtime = 'edge';

export default async function PendingApprovalPage() {
  const { profile } = await requireRole(['pending_sponsor']);

  return (
    <AuthCard
      title="Awaiting approval"
      subtitle="Thank you for registering — an administrator will review your account shortly."
      footer={<SignOutButton />}
    >
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          Hi <span className="font-semibold text-slate-900">{profile.full_name}</span>, your sponsor
          account has been created and is pending review by the Al-Huffaz admin team.
        </p>
        <p>
          You'll receive an email as soon as it's approved. After that you can sign in and start
          sponsoring students.
        </p>
      </div>
    </AuthCard>
  );
}
