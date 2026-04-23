# CLAUDE.md — Al-Huffaz Portal v3 Master Memory

> **If you are a Claude session opening this repo for the first time:**
> this file is your onboarding. Read it top-to-bottom, then follow the
> links into `docs/` as needed. Do NOT start coding features before you
> have read at least sections 1–6 of this file plus
> [`docs/03-database-schema.md`](./docs/03-database-schema.md) and
> [`docs/08-phased-plan.md`](./docs/08-phased-plan.md).

---

## 1. What this project is

Al-Huffaz Education Portal is the student / sponsor / payment management
system for **Al-Huffaz Islamic School** (Pakistan, currency PKR).

- **Students** are enrolled children with rich academic, health, family,
  and fee profiles. A subset are "donation-eligible" — i.e. they need a
  sponsor to pay their fees.
- **Sponsors** are donors (domestic or international) who register,
  browse available students, request a sponsorship, and submit payment
  proofs.
- **Admins / Staff** run the school side: approve sponsorships, verify
  payments, manage students, review reports.

This repo (**v3**) is a ground-up rewrite. **v2** is the WordPress plugin
that still lives in the parent repo at `al-huffaz-portal/` — that code is
the *functional reference* but not the code to port. We are rebuilding
from clean specs, not translating PHP line-by-line.

---

## 2. Why we are rewriting

- v2 is a ~20k-line WordPress plugin with many "fix-on-top-of-fix" layers.
  Root folder contains 15+ standalone PHP files that have been migrated
  into the plugin multiple times (see `MIGRATION-LOG-*.md`,
  `URGENT-FIX-APPLIED.md`, `ADMIN-PORTAL-FIXES-NEEDED.md`).
- Tightly coupled to WordPress + Ultimate Member plugin.
- Hard to modify safely (no types, no tests, 60+ AJAX endpoints with
  overlapping responsibilities).
- Adding a payment gateway cleanly is more work in the current code than
  a fresh rewrite.
- Owner wants a modern, maintainable stack that can be iterated on easily.

---

## 3. Non-negotiable constraints

1. **Budget:** hosting must cost ~**$12/year** (just the domain). All
   other infra runs on free tiers.
2. **Domain:** kept on **Namecheap** (or moved to Cloudflare Registrar).
   DNS pointed at Cloudflare.
3. **Deployment:** **Cloudflare Pages** (free, allows commercial use).
   *Not* Vercel Hobby — Vercel Hobby forbids commercial use and this
   project accepts payments.
4. **Database / auth / storage:** **Supabase** free tier (500 MB DB,
   1 GB storage). When free tier is outgrown, upgrade Supabase Pro
   (~$25/mo) OR migrate file storage to Cloudflare R2 (10 GB free).
5. **Commercial use = real payments.** Every infra choice must allow it.
6. **Feature parity with v2** is the target for v3.0.0 before adding new
   features.

---

## 4. Tech stack (decided)

| Layer          | Choice                                     | Rationale                                      |
| -------------- | ------------------------------------------ | ---------------------------------------------- |
| Framework      | **Next.js 15** App Router                  | Best DX, edge-ready, Cloudflare support        |
| Runtime        | **Edge** (`export const runtime = 'edge'`) | Required for Cloudflare Pages                  |
| Language       | **TypeScript** strict                      | Type safety, fewer runtime bugs than PHP       |
| Styling        | **Tailwind CSS** + small shadcn/ui subset  | Fast, consistent, no CSS bikeshedding          |
| Database       | **Supabase Postgres**                      | Free, real Postgres, RLS built in              |
| Auth           | **Supabase Auth**                          | Email+password, magic link, social, ships free |
| File storage   | **Supabase Storage** → R2 later            | Simple now, cheap at scale                     |
| ORM            | **Drizzle ORM**                            | Lightweight, edge-compatible, type-safe        |
| Forms          | **React Hook Form + Zod**                  | Small, fast, validates in client+server        |
| Hosting        | **Cloudflare Pages** + `@cloudflare/next-on-pages` | Free commercial, global edge      |
| Email          | **Resend**                                 | 3k/mo free, simple API                         |
| Payment        | **TBD** — see §8                           | Decision required before Phase 4               |

Full rationale in [`docs/02-tech-stack.md`](./docs/02-tech-stack.md).

---

## 5. Domain model (cheat sheet)

See [`docs/03-database-schema.md`](./docs/03-database-schema.md) for the
full Postgres schema with RLS policies. High level:

```
profiles              one row per auth user, role enum
schools               (future multi-tenant) — MVP: single row
students              core student record
student_academics     per-term academics, subjects, percentages
student_attendance    per-term attendance
student_behavior      per-term behavior ratings
student_fees          per-term fee line-items
sponsors              one profile per sponsor user (auto-created on approval)
sponsorships          link table: sponsor ↔ student, status, amount
payments              sponsor-submitted proofs, admin-verified
notifications         per-user notification inbox
activity_log          audit trail
attachments           file references (photos, payment screenshots)
```

**Roles (enum):** `admin`, `staff`, `sponsor`, `pending_sponsor`.

**Row Level Security policies** must be written for every table.
Sponsors can only see their own sponsorships, payments, and (limited)
info on students they sponsor. Admins see everything. Staff see students
only.

---

## 6. Features to clone from v2

Complete list with source file references in
[`docs/04-features.md`](./docs/04-features.md). Summary:

**Public / sponsor-facing**
- Unified login page (admin, staff, sponsor all land here)
- Sponsor registration (with admin approval step)
- Available students grid (donation-eligible, unsponsored, with fee calc)
- Single student page
- Sponsor dashboard (my students, my payments, notifications)
- Sponsorship request form
- Payment submission form (with screenshot upload)

**Admin portal**
- Dashboard with stats
- Students CRUD (with all the fields: basic, family, address, fees,
  health, attendance, academics, behavior, goals)
- Sponsorships queue — approve / reject / link / unlink
- Payments queue — verify / reject
- Sponsor users management — approve / reject / re-engage
- Staff management — grant / revoke staff role
- Bulk import students (CSV)
- Export data (CSV)
- Activity log / audit trail
- Settings (school info, currency, grade levels, academic year)
- Notifications

**Integrations to rebuild**
- Ultimate Member sponsor registration → replace with Supabase Auth +
  admin approval gate
- Payment screenshots → Supabase Storage with RLS
- Email notifications → Resend

---

## 7. What NOT to carry over from v2

- Any WordPress / WP plugin hooks (`add_action`, `add_filter`, etc.).
- The dual legacy/consolidated CPT system — we have one clean schema.
- The "standalone PHP file in root + same thing in plugin" duplication.
- Manual nonce / security hacks — Supabase RLS handles most of this.
- The massive `class-ajax-handler.php` pattern — use Next.js route
  handlers and server actions, one file per concern.
- `ADMIN-PORTAL-FIXES-NEEDED.md`, `URGENT-FIX-APPLIED.md`, etc. — these
  are notes about v2 bugs. Don't port the bugs. Read them to *avoid*
  those pitfalls in v3.

---

## 8. Open decisions (ask the owner before building these)

1. **Payment gateway.** Options in [`docs/06-payments.md`](./docs/06-payments.md):
   - Local PK: JazzCash, Easypaisa, HBL, Paymob
   - International: Stripe, 2Checkout/Verifone
   - Need to know: donor geography split (PK vs international).
2. **Multi-tenant or single school?** v2 is single-school. Schema is
   designed to allow multi-tenant but RLS assumes single school for now.
3. **Data migration.** Will v2 data be migrated into v3, or is v3 a
   fresh start with manual data entry? See
   [`docs/09-migration-from-v2.md`](./docs/09-migration-from-v2.md).
4. **Languages.** v2 has `text domain 'al-huffaz-portal'` — is Urdu
   localization needed for v3?

---

## 9. Current state of this repo

- ✅ Config files (package.json, tsconfig, Tailwind, Next.js, Cloudflare)
- ✅ Hello page at `/` + health endpoint at `/api/health`
- ✅ Supabase client/server stubs in `lib/supabase/`
- ✅ Full spec docs under `docs/`
- ❌ No database migrations yet
- ❌ No auth pages yet
- ❌ No features built yet

First deploy target: **hello page visible at the Cloudflare Pages URL.**
Nothing more.

---

## 10. How to work on this project

### Before coding a feature
1. Read the relevant `docs/` file.
2. Check [`docs/08-phased-plan.md`](./docs/08-phased-plan.md) — is this
   the right phase to build this feature?
3. If schema changes are needed, update
   [`docs/03-database-schema.md`](./docs/03-database-schema.md) **in the
   same PR** as the migration.

### Conventions
- **Server Components by default.** Only use `'use client'` when you
  need interactivity (forms, client hooks).
- **Server Actions** for mutations. API route handlers only for
  webhooks / third-party callbacks.
- **Edge runtime** for every route (`export const runtime = 'edge'`).
- **RLS-first auth.** Don't filter `WHERE user_id = ...` in queries —
  let Supabase RLS do it.
- **One feature per folder** under `app/`. Keep co-located components
  next to the route.
- **Money in integer minor units** (paise for PKR) in the DB. Never
  store floats for money.
- **Dates in UTC** in DB, format on the edge.
- **No TypeScript `any`** — use `unknown` + narrow, or define types.

### Testing
- Playwright for E2E on critical flows (login, sponsor request, payment
  submit, admin approval).
- Skip unit tests for now — E2E gives us the most value at v3.0 scope.

### Commits / branches
- Feature branches: `feat/<area>-<short-desc>`
- Fix branches: `fix/<area>-<short-desc>`
- Keep PRs small — one feature at a time.

---

## 11. Key links

- [`docs/01-project-context.md`](./docs/01-project-context.md) — full business context
- [`docs/02-tech-stack.md`](./docs/02-tech-stack.md) — stack rationale
- [`docs/03-database-schema.md`](./docs/03-database-schema.md) — Postgres schema
- [`docs/04-features.md`](./docs/04-features.md) — every feature to build
- [`docs/05-auth-and-roles.md`](./docs/05-auth-and-roles.md) — auth flows, roles
- [`docs/06-payments.md`](./docs/06-payments.md) — payment gateway plan
- [`docs/07-deployment.md`](./docs/07-deployment.md) — Cloudflare + Supabase setup
- [`docs/08-phased-plan.md`](./docs/08-phased-plan.md) — build order
- [`docs/09-migration-from-v2.md`](./docs/09-migration-from-v2.md) — v2 → v3 data
- v2 reference code: `../al-huffaz-portal/` (WordPress plugin, **read-only reference**)
