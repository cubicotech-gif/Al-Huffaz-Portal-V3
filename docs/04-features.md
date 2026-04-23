# 04 — Feature List (v2 → v3)

Every feature in v2 that must exist in v3 before we call it "feature
parity" (v3.0.0). Grouped by role. Source references point to the v2
code under `../al-huffaz-portal/` for functional context.

Legend:
- **MVP** — ship in first real release
- **P1** — shortly after MVP
- **P2** — nice-to-have

---

## Public (no login required)

### Home landing
- Short description, links to login and sponsor registration.
- **MVP**

### Browse available students
- Grid of donation-eligible, unsponsored students.
- Per-card: photo, first name (consider privacy), grade level, Islamic
  category, monthly fee total, "Sponsor this student" button.
- Filters: grade, gender, Islamic category, fee range.
- Sort: recently added, fee ascending/descending.
- v2 ref: `al-huffaz-portal/templates/public/available-students.php`,
  `class-student-display.php`.
- **MVP**

### Single student (public view — limited)
- Only if student is still public-available. Show safe columns only
  (no family phone numbers etc.).
- v2 ref: `templates/public/single-student.php`.
- **MVP**

---

## Auth

### Unified login
- Single page for admin / staff / sponsor.
- Email + password (Supabase Auth).
- On success, redirect by role: admin → `/admin`, staff →
  `/admin/students`, sponsor → `/sponsor`.
- v2 ref: `templates/public/unified-login.php`,
  `includes/core/class-login-redirects.php`.
- **MVP**

### Sponsor registration
- Fields: full name, email, password, phone, country, whatsapp.
- Creates `auth.users` + `profiles` row with role `pending_sponsor`.
- Admin is notified; sponsor sees "pending approval" page.
- On admin approval: role flips to `sponsor`, `sponsors` row is
  auto-created, welcome email sent.
- v2 ref: `templates/public/sponsor-registration.php`,
  `class-um-integration.php`.
- **MVP**

### Password reset
- Supabase Auth's built-in flow.
- **MVP**

### Logout
- **MVP**

---

## Sponsor portal (role: `sponsor`)

### Dashboard (`/sponsor`)
- Summary cards: students sponsored, total paid this year, pending
  payments, notifications.
- Recent activity feed.
- v2 ref: `includes/public/class-sponsor-dashboard.php`,
  `templates/public/sponsor-dashboard.php`.
- **MVP**

### My students (`/sponsor/students`)
- List of students the sponsor is actively sponsoring.
- Click through to student detail page (shows academic, attendance
  summaries).
- **MVP**

### Make a payment (`/sponsor/pay`)
- Select sponsorship.
- Enter amount, date, method, bank name, transaction ID, notes.
- Upload screenshot (Supabase Storage).
- Create `payments` row with status `submitted`.
- v2 ref: `templates/public/payment-form.php`,
  `class-payment-form.php`.
- **MVP**

### My payments history (`/sponsor/payments`)
- Table: date, student, amount, method, status, proof link.
- Filter by status, year.
- **MVP**

### Request sponsorship (on student page)
- Button on available student page.
- Fills `sponsorships` with `status=requested`.
- Admin is notified.
- **MVP**

### Notifications inbox
- List, mark-read, mark-all-read.
- **MVP**

### Profile / settings
- Edit own name, phone, country, whatsapp, password.
- **P1**

---

## Admin portal (role: `admin`)

### Dashboard (`/admin`)
- Stats: total students, active sponsorships, pending approvals,
  payments this month, new sponsor registrations.
- Charts: monthly payments, student counts by grade.
- Recent activity log (last 20).
- v2 ref: massive `templates/frontend-admin/portal.php`.
- **MVP**

### Students
- List with pagination, search, filters (grade, category, sponsored,
  donation-eligible, archived).
- Numbered rows, sort by any column.
- v2 improved this recently — see git log "Improve admin Students panel:
  numbering, full pagination, more filters, sort".
- Create / Edit form — all student fields grouped into tabs:
  Basic, Family, Address, Fees, Health, Attendance, Academics,
  Behavior, Goals, Sponsorship.
- Upload photo.
- Archive (soft delete) + restore.
- **MVP**

### Sponsorships
- Queue tabs: Requested, Approved, Active, Paused, Cancelled, Rejected.
- Approve / reject with reason.
- Link / unlink sponsor ↔ student manually.
- View full history of a sponsorship (all payments).
- v2 ref: many AJAX endpoints in `class-ajax-handler.php`
  (`approve_sponsorship`, `link_sponsor`, etc.).
- **MVP**

### Payments
- Queue tabs: Submitted, Verified, Rejected.
- Verify / reject with reason.
- See proof image inline.
- Filter by date range, sponsor, student.
- Bulk actions (verify many at once).
- **MVP**

### Sponsor users
- List all users with role `sponsor` or `pending_sponsor`.
- Approve / reject pending sponsors.
- View sponsor's students, payments, activity.
- Send re-engagement email (sponsors who went inactive).
- Delete sponsor account (edge case — handle orphaned sponsorships per
  v2 fix `CRITICAL FIX: Orphaned students from deleted sponsors`).
- v2 ref: many AJAX endpoints (`get_sponsor_users`,
  `approve_sponsor_user`, `send_reengagement_email`).
- **MVP**

### Staff management
- List users with role `staff`.
- Grant staff role to an existing user (by email).
- Revoke staff role.
- v2 ref: `grant_staff_role`, `revoke_staff_role` AJAX.
- **MVP**

### Bulk import students (CSV)
- Upload CSV → preview → confirm → import.
- Report errors per-row.
- v2 ref: `al-huffaz-bulk-import.php` (standalone) +
  `ahp_bulk_import` AJAX.
- **P1**

### Export
- CSV export of students, sponsorships, payments.
- **P1**

### Activity log
- Searchable, filterable by actor, action, object type, date.
- v2 ref: `get_activity_logs` AJAX.
- **P1**

### Settings
- School info, currency (display only; hardcoded PKR for now),
  academic year, grade levels, Islamic categories.
- Email templates (if we do server-side email templating).
- **P1**

### Reports / analytics
- Monthly revenue chart, sponsor retention, student sponsorship rate.
- v2 ref: `get_payment_analytics`, `get_sponsor_payment_summary`.
- **P2**

---

## Staff portal (role: `staff`)

Staff are restricted to student management only.

### Students
- Same UI as admin's students module but without archive/delete.
- Can create and edit.
- **MVP**

Nothing else is staff-accessible.

---

## Cross-cutting

### Email notifications (via Resend)
- Sponsor registered → admin notification.
- Sponsor approved → welcome email to sponsor.
- Sponsorship requested → admin notification.
- Sponsorship approved/rejected → sponsor email.
- Payment submitted → admin notification.
- Payment verified/rejected → sponsor email.
- **MVP** (for verify/approve flows); other emails **P1**.

### In-app notifications
- Same events, stored in `notifications` table.
- Bell icon with unread count.
- **MVP**

### File storage
- Student photos, payment screenshots.
- Bucket strategy:
  - `student-photos/` — admin/staff write, authenticated read.
  - `payment-proofs/<sponsor_id>/` — sponsor writes their own, admin
    reads all.
- **MVP**

### Audit trail
- Every status-changing action writes to `activity_log`.
- Uses Postgres triggers where possible, application code where not.
- **MVP**

---

## Features from v2 we are deliberately dropping
- Ultimate Member plugin dependency (replaced by Supabase Auth).
- Legacy standalone PHP files in v2 repo root.
- Duplicate/old `alhuffaz_sponsor` CPT (v2 already removed, confirming here).
- WP-specific SEO / rewrite rules / taxonomies — not needed in Next.js.
