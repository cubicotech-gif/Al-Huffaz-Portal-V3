# 02 — Tech Stack & Rationale

## Decisions summary

| Layer | Choice | Alternatives rejected |
|---|---|---|
| Framework | Next.js 15 App Router | Remix (smaller ecosystem), Astro (less dynamic) |
| Runtime | Edge (Cloudflare Workers via `next-on-pages`) | Node (not free on Cloudflare for SSR) |
| Language | TypeScript (strict) | JavaScript (no), PHP (that's what we're leaving) |
| UI | Tailwind CSS + selective shadcn/ui components | CSS modules (slower), MUI (heavy) |
| DB | Supabase Postgres | Cloudflare D1 (SQLite, less powerful), PlanetScale (now paid-only), Neon (good alt but Supabase bundles auth+storage) |
| ORM | Drizzle | Prisma (heavy on edge), raw SQL (no types) |
| Auth | Supabase Auth | Clerk (free tier weaker), NextAuth (more DIY) |
| Storage | Supabase Storage → R2 later | S3 (paid), direct R2 (no built-in RLS) |
| Forms | React Hook Form + Zod | Formik (outdated), native forms (no validation) |
| Hosting | Cloudflare Pages | Vercel (forbids commercial on free), Netlify (commercial OK but smaller free tier) |
| Email | Resend | SendGrid (worse free tier), SES (more setup), Postmark (paid) |

## Why each choice

### Next.js 15 App Router
- Server Components + Server Actions reduce API surface.
- File-based routing maps well to the portal's page-heavy nature.
- First-class Cloudflare Pages support via `@cloudflare/next-on-pages`.
- Huge ecosystem, easy for future maintainers (and future Claude
  sessions) to pick up.

### Edge runtime
- Cloudflare Pages free plan only supports edge functions for SSR.
- Edge = global low-latency — good for international sponsors.
- Forces discipline: no heavy Node-only libs, smaller bundles.
- All routes declare `export const runtime = 'edge';`.

### Supabase
- Postgres (real one), not SQLite or MySQL variants.
- **Row Level Security** is the killer feature — we define security
  policies once in SQL and every query enforces them automatically.
  This is much safer than the v2 pattern of per-endpoint capability
  checks that can be forgotten.
- Auth + Storage + Realtime ship in the same project = less glue code.
- Free tier is enough for launch.

### Drizzle ORM (not Prisma)
- Prisma's edge support requires Prisma Accelerate (paid) or Data Proxy.
- Drizzle compiles to plain SQL, works on edge out of the box.
- Lightweight, fully typed, schema-in-TypeScript.
- Migrations via `drizzle-kit`.

### Cloudflare Pages (not Vercel)
- **Commercial use is allowed on the free plan.** This is the
  deal-breaker for Vercel Hobby.
- Unlimited bandwidth on free tier.
- GitHub integration for auto-deploy on push.
- DNS + domain management in the same dashboard if we move the domain.

### Resend for email
- Clean TypeScript SDK.
- 3k emails/month on free tier, enough for MVP.
- Supabase Auth can be wired to send via Resend SMTP.

## Third-party libraries we will use (confirmed)

- `next` 15
- `react` 19, `react-dom` 19
- `@supabase/supabase-js`, `@supabase/ssr`
- `drizzle-orm`, `drizzle-kit`, `postgres` (driver)
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `date-fns` (formatting)
- `clsx`, `tailwind-merge` (class composition)
- `lucide-react` (icons)
- `resend` (emails)
- Specific shadcn/ui components as needed (copy-paste approach, not npm)

## Libraries deliberately avoided
- **Redux / Zustand / Jotai** — Server Components + URL state + React
  Hook Form cover 95% of needs.
- **GraphQL** — overkill for single-consumer app.
- **tRPC** — Server Actions give us most of the value with less setup.
- **Moment.js / Luxon** — `date-fns` is smaller and tree-shakes.
- **Axios** — native `fetch` is fine.

## Version policy
- Pin major versions in `package.json` (`^15.0.0` for Next).
- Upgrade deliberately, not automatically.
- Re-evaluate this stack every 12 months.
