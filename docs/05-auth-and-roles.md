# 05 — Auth & Roles

## Roles

Stored on `profiles.role` (enum `user_role`):

| Role | Who | What they can do |
|---|---|---|
| `admin` | School management | Everything |
| `staff` | Teachers / office | Create + edit students only |
| `sponsor` | Approved donors | Sponsor-facing portal |
| `pending_sponsor` | Newly registered sponsor awaiting approval | View a "pending approval" page only |

## Authentication flows

### Sponsor self-registration
1. POST `/auth/register` (Server Action) with
   `{ email, password, full_name, phone, country, whatsapp }`.
2. Zod validation.
3. `supabase.auth.signUp({ email, password, options: { data: { full_name, phone, country, whatsapp } } })`.
4. Postgres trigger on `auth.users insert` creates `profiles` row with
   `role = 'pending_sponsor'`.
5. Send admin notification email via Resend.
6. Redirect user to `/pending-approval`.

### Admin approves a pending sponsor
1. Admin action in `/admin/sponsors`.
2. Server Action transaction:
   - `update profiles set role='sponsor', approved_at=now(), approved_by=<admin_id> where id=<user_id>`
   - `insert into sponsors (profile_id, display_name, email, phone, country, whatsapp, approved_at) ...`
   - `insert into notifications (...)` for the sponsor.
   - `insert into activity_log (...)`.
3. Send welcome email.

### Login
- Single page `/login` — Supabase `signInWithPassword`.
- On success, read `profiles.role`, redirect:
  - `admin` → `/admin`
  - `staff` → `/admin/students`
  - `sponsor` → `/sponsor`
  - `pending_sponsor` → `/pending-approval`

### Password reset
- Built-in Supabase flow: `resetPasswordForEmail` → email link →
  `/auth/reset-password` page.

### Logout
- Server Action calling `supabase.auth.signOut()`, redirect `/`.

## Session handling

- Supabase SSR package (`@supabase/ssr`) manages cookies across Server
  Components, Route Handlers, and Server Actions.
- **Middleware** (`middleware.ts`) refreshes the session on every
  request. See Supabase Next.js guide.
- Client Components that need session use `createBrowserClient`.

## Authorization

**Never** check roles in component code alone. Authorization flows
through two layers:

1. **Route protection (middleware):**
   - `/admin/*` → require role in (`admin`, `staff`). Staff further
     restricted at route level inside `/admin/*`.
   - `/sponsor/*` → require role `sponsor`.
   - `/pending-approval` → require role `pending_sponsor`.
2. **Data layer (RLS):**
   - Every query goes through Supabase with the user's JWT.
   - RLS policies on every table enforce access.
   - If a middleware check is bypassed, data access still fails.

## Helper: `requireRole`

```ts
// lib/auth.ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

export async function requireRole(allowed: UserRole[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) redirect('/login');
  if (!allowed.includes(profile.role)) redirect('/');

  return { user, profile };
}
```

Use at the top of each protected page:

```ts
// app/admin/page.tsx
export default async function AdminHome() {
  await requireRole(['admin', 'staff']);
  // ...
}
```

## Rate limiting

- Use Cloudflare's built-in rate limiting rules in front of `/auth/*`
  and `/api/*` webhook endpoints.
- No code-level rate limiter in v3.0 — rely on edge rules.

## Security checklist (must satisfy before shipping)

- [ ] RLS enabled on every table.
- [ ] RLS policies cover every operation (select/insert/update/delete).
- [ ] No client-side Supabase call uses the service role key.
- [ ] Service role key only used in Server Actions / Route Handlers,
      never exposed via `NEXT_PUBLIC_*` env vars.
- [ ] Password reset tokens never logged.
- [ ] File upload endpoints validate mime type + max size at both the
      Supabase Storage policy level and app-side.
- [ ] CSRF: Server Actions use Next.js built-in protection; no custom
      state mutations via GET.
- [ ] XSS: no `dangerouslySetInnerHTML` except for trusted content.
