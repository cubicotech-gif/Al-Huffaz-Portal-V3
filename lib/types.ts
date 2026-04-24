export type UserRole = 'admin' | 'staff' | 'sponsor' | 'pending_sponsor';

// Phase 1: staff lands on /admin alongside admin. When /admin/students is
// built in Phase 2, point staff there per docs/05-auth-and-roles.md.
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  staff: '/admin',
  sponsor: '/sponsor',
  pending_sponsor: '/pending-approval',
};
