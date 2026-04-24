# 07 — Deployment

## Big picture

```
[ Namecheap Domain ]
         │  DNS records
         ▼
[ Cloudflare (DNS + Pages) ]
         │  HTTPS requests
         ▼
[ Next.js on Cloudflare Pages (Edge) ]
         │  JWT, REST, Storage URLs
         ▼
[ Supabase (Postgres + Auth + Storage) ]
```

- **Domain:** Namecheap (registrar). Optionally move to Cloudflare
  Registrar later (cheaper renewal, no markup).
- **DNS:** Cloudflare (free). Add `A` / `CNAME` records pointing at
  Pages.
- **Frontend + API + SSR:** Cloudflare Pages, free tier, commercial use
  allowed.
- **Database / auth / storage:** Supabase free tier initially.
- **Email:** Resend (separate domain records for deliverability).

## First-time setup

### 1. Cloudflare account
- Create a Cloudflare account (free).
- Add the domain. Cloudflare gives you two nameservers.

### 2. Namecheap DNS
- In Namecheap dashboard → domain → "Nameservers" → select "Custom DNS".
- Paste the two Cloudflare nameservers.
- Wait for propagation (5 min – 24 h, usually minutes).

### 3. Supabase project
- Create free project at supabase.com.
- Note down:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only!)
- Set project region close to Pakistan (e.g. `ap-south-1` Mumbai).

### 4. Resend account
- Create Resend account.
- Add your sending domain, add the DKIM/SPF/MX records to Cloudflare DNS.
- API key → `RESEND_API_KEY`.

### 5. Cloudflare Pages project
- Dashboard → Pages → Create project → Connect to GitHub.
- Select the new repo (the one you'll carve out of `portal-v3/`).
- Build settings:
  - **Framework preset:** Next.js
  - **Build command:** `npx @cloudflare/next-on-pages@latest`
  - **Build output directory:** `.vercel/output/static`
  - **Root directory:** (blank if repo root; else `/`)
  - **Environment variables:** add every value from `.env.example`.
  - **Node version:** 20 (via `NODE_VERSION=20` env or `.node-version`).
- Click Save and Deploy.

### 6. Custom domain
- In the Pages project → Custom domains → Add domain.
- Cloudflare auto-creates the DNS records for you.
- HTTPS cert provisions automatically.

### 7. Verify
- Visit the custom domain → should see the hello page.
- Visit `/api/health` → should return JSON.

## Ongoing deployments

### Continuous deployment
Every push to the `main` branch of the GitHub repo auto-deploys to
production. Every push to other branches creates a preview deployment
with a unique URL (great for review).

### Manual deploy
```bash
npm run pages:deploy
```
(Uses `wrangler`; requires `CLOUDFLARE_API_TOKEN` locally.)

### Local preview of the production build
```bash
npm run pages:preview
```

## Environment variables

### On Cloudflare Pages (Production + Preview)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY         (secret)
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_CURRENCY
NEXT_PUBLIC_CURRENCY_SYMBOL
RESEND_API_KEY                    (secret)
RESEND_FROM_EMAIL
PAYMENT_*                         (secrets)
```

Mark sensitive keys as "encrypted" in the Cloudflare dashboard.

### Locally
- Copy `.env.example` → `.env.local`.
- Fill with your dev Supabase project values (use a separate Supabase
  project for dev, don't point at prod).

## Database migrations

- Authored as raw SQL in `supabase/migrations/` (source of truth).
- Drizzle schema in `lib/db/schema.ts` provides TypeScript types and can
  optionally generate migrations via `drizzle-kit`; we hand-write the SQL
  to keep RLS, triggers and views explicit.
- Apply to a Supabase project:
  ```bash
  # Option A — Supabase CLI (preferred once project is linked)
  npx supabase link --project-ref <your-ref>
  npx supabase db push

  # Option B — paste the SQL files into Supabase SQL Editor in order:
  #   0001_initial_schema.sql
  #   0002_rls_policies.sql
  #   0003_triggers_and_views.sql
  ```
- Apply to prod: CI step triggered on merge to `main` (after first
  deployment is working).

### Creating the first admin user

The `auth.users → profiles` trigger defaults every new account to
`pending_sponsor`. To bootstrap the first admin:

1. Create an account via Supabase Dashboard → Authentication → Users →
   "Add user" (set email + password, confirm email).
2. Open the SQL editor and run:
   ```sql
   update profiles
   set role = 'admin', approved_at = now()
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Sign in at `/login` — you should land at `/admin`.

## Backups

- Supabase free tier: **no automatic PITR, but daily snapshots**.
- Add a scheduled Cloudflare Worker to dump critical tables to R2 weekly
  as CSV, once we're past Phase 1. (Defer to when the data is real.)

## Monitoring

- Cloudflare Pages analytics (built in, free).
- Supabase dashboard for DB health + logs.
- Resend dashboard for email delivery.
- For errors, add Sentry (free tier) later — **not** MVP.

## Rollback

- Cloudflare Pages → Deployments → click a previous deploy → "Rollback
  to this deployment."
- For DB: requires manual SQL, or restore from snapshot in Supabase.
  Keep schema changes small and reversible.

## Cost at scale (ballpark)

| Service | Free tier limit | When you outgrow it |
|---|---|---|
| Cloudflare Pages | 100k requests/day (free tier has generous limits) | Buy Workers Paid ($5/mo) |
| Supabase | 500 MB DB, 1 GB storage, 2 GB egress | Supabase Pro ($25/mo) or move storage to R2 |
| R2 | 10 GB storage, 1M Class A ops/mo | Pennies per additional GB |
| Resend | 3k emails/mo | $20/mo for 50k |
| Domain | ~$12/yr at Namecheap | Move to Cloudflare Registrar for ~$8/yr |

Expected total at MVP launch: **~$12/year** (just the domain).
