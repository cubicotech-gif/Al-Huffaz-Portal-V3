# 08 — Phased Build Plan

Build order. Each phase ends with something deployable and demoable.
**Do not skip ahead.** Later phases assume earlier ones are done.

---

## Phase 0 — Foundation (this commit)

✅ Already done in this repo.

- Next.js 15 scaffolding.
- Tailwind, TypeScript, ESLint.
- Cloudflare Pages config (`wrangler.toml`, `@cloudflare/next-on-pages`).
- Hello page + `/api/health`.
- Supabase client stubs.
- All spec docs.

**Exit criteria:** repo can be carved out to a new GitHub repo,
connected to Cloudflare Pages, and the hello page is live at the
custom domain.

**Time estimate:** already complete.

---

## Phase 1 — Database + auth skeleton

Goal: real database, users can sign up and log in, role is assigned.

Tasks:
- [ ] Create Supabase project (dev + prod).
- [ ] Write Drizzle schemas for every table in
      `docs/03-database-schema.md`.
- [ ] Generate initial migration; apply locally.
- [ ] Write RLS policies (separate migration).
- [ ] Add trigger: `auth.users insert → profiles insert`.
- [ ] Add middleware for session refresh + route protection.
- [ ] Build `/login` page (Supabase Auth).
- [ ] Build `/register` (sponsor registration).
- [ ] Build `/pending-approval` page.
- [ ] Build `/admin` placeholder gated to admin role.
- [ ] Build `/sponsor` placeholder gated to sponsor role.
- [ ] Manually create the first admin user via Supabase dashboard + SQL.

**Exit criteria:** can register a sponsor, admin manually approves via
SQL, sponsor logs in and lands on `/sponsor`.

**Time estimate:** 1 week focused, 2 weeks part-time.

---

## Phase 2 — Student management (admin + staff)

Goal: admin/staff can manage students end-to-end.

Tasks:
- [ ] `/admin/students` list with search, filter, sort, pagination.
- [ ] `/admin/students/new` create form (all fields, tabbed UI).
- [ ] `/admin/students/[id]` edit form.
- [ ] Photo upload → Supabase Storage bucket `student-photos`.
- [ ] Archive / restore.
- [ ] Related tables forms (fees, attendance, academics, behavior) —
      start with fees; others can be stubs that save JSON for now.
- [ ] Seed a few test students.

**Exit criteria:** admin can CRUD a student with photo.

**Time estimate:** 2 weeks.

---

## Phase 3 — Public browsing + sponsor self-service

Goal: a sponsor can browse, request a sponsorship, and see their
dashboard.

Tasks:
- [ ] Landing page `/` — replace hello page with real hero + CTA.
- [ ] `/students` public available-students grid + filters.
- [ ] `/students/[id]` public student page (safe columns only).
- [ ] "Sponsor this student" button → creates `sponsorships` row with
      `status=requested`.
- [ ] `/admin/sponsorships` queue + approve/reject actions.
- [ ] `/sponsor` dashboard with real stats.
- [ ] `/sponsor/students` my-students list.
- [ ] Notifications table + bell icon UI.

**Exit criteria:** full request → approve → sponsor-sees-student flow
works.

**Time estimate:** 2 weeks.

---

## Phase 4 — Payments (manual flow first)

Goal: sponsor submits a payment proof, admin verifies, state transitions.

Tasks:
- [ ] `/sponsor/pay` form with screenshot upload.
- [ ] Supabase Storage bucket `payment-proofs` with RLS.
- [ ] `/sponsor/payments` history.
- [ ] `/admin/payments` queue + verify/reject.
- [ ] Status transition triggers (sponsorship → active on first
      verified payment).
- [ ] Email notifications via Resend (payment submitted, verified).

**Exit criteria:** end-to-end manual payment flow works, email arrives.

**Time estimate:** 1 week.

---

## Phase 5 — Sponsor & staff management

Goal: admin can manage user accounts.

Tasks:
- [ ] `/admin/sponsors` list + approve/reject pending.
- [ ] View sponsor's students, payments.
- [ ] Send re-engagement email.
- [ ] Delete sponsor account (handle orphaned sponsorships — mark
      `ended_at`, keep history).
- [ ] `/admin/staff` — grant/revoke staff role by email lookup.

**Exit criteria:** admin can run sponsor lifecycle without SQL.

**Time estimate:** 1 week.

---

## Phase 6 — Polish + feature parity

Tasks:
- [ ] Bulk CSV import for students.
- [ ] CSV exports (students, payments, sponsorships).
- [ ] Activity log page.
- [ ] Settings page.
- [ ] Basic charts on admin dashboard.
- [ ] Playwright E2E covering login → request → pay → verify.
- [ ] Mobile polish on sponsor pages.

**Exit criteria:** everything from `docs/04-features.md` marked MVP is
shipped.

**Time estimate:** 2 weeks.

---

## Phase 7 — Real payment gateway

Only once Phases 1–6 are live and stable. Requires owner to have
decided which provider.

Tasks:
- [ ] Implement `PaymentProvider` interface for chosen gateway.
- [ ] `/api/payments/initiate` route handler.
- [ ] `/api/payments/webhook/<provider>` route handler.
- [ ] Toggle in payment form: manual vs gateway.
- [ ] Test with sandbox → test with real small payment → ship.

**Exit criteria:** a real payment processes end-to-end, webhook flips
status to `verified` without admin intervention.

**Time estimate:** 2 weeks once provider is chosen + onboarded.

---

## Phase 8 — Data migration from v2 (if needed)

Only if the WordPress v2 data is being kept. See
[`docs/09-migration-from-v2.md`](./09-migration-from-v2.md).

**Time estimate:** 1–2 weeks depending on v2 data volume + quality.

---

## Total realistic timeline

**Phases 0–6 (feature parity, manual payments):** ~8 weeks focused work,
~3 months part-time.

**Phase 7 (real gateway):** +2 weeks.

**Phase 8 (v2 migration):** +1–2 weeks.

**MVP ready for real users: ~3 months part-time.** Do not over-promise.

---

## How to work this plan with Claude

For each phase, open a new chat and:

1. Point Claude at `CLAUDE.md`.
2. Say "We are in Phase N. Read `docs/08-phased-plan.md` for context,
   then start task X."
3. Review every PR yourself — Claude writes code fast but you're the
   domain expert.
4. Don't run more than one phase in parallel.
