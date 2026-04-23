# 09 — Migration from v2 (WordPress) to v3

## Scope decision

Before any migration work, decide with the owner:

- **Option A — Fresh start.** v3 launches empty. Admins re-enter the
  small set of active students + sponsors. Old v2 stays online read-only
  on its existing host as an archive for 3–6 months, then sunsetted.
  *Recommended if the data volume is small (dozens of students, tens of
  sponsors).*
- **Option B — Full migration.** Export v2 data, transform, bulk insert
  into v3. More work but preserves history.
- **Option C — Parallel cutover.** Keep v2 running, mirror new writes to
  v3, cut over when feature parity is met. Most complex. Generally not
  worth it for this scale.

Default assumption: **Option A** unless data volume justifies the extra
work.

---

## If we go with Option B

### v2 data sources

WordPress DB tables:

- `wp_posts` — rows where `post_type in ('student', 'sponsor', 'sponsorship')`
- `wp_postmeta` — key-value metadata per post (the bulk of the data)
- `wp_users` + `wp_usermeta` — sponsor user accounts
- `wp_alhuffaz_payments` — custom table
- `wp_alhuffaz_notifications` — custom table
- `wp_alhuffaz_activity_log` — custom table

### Mapping

| v2 | v3 |
|---|---|
| `wp_posts.post_type='student'` + meta | `students` + `student_fees`/`student_attendance`/etc. |
| `wp_posts.post_type='sponsor'` + meta | `sponsors` (linked to `profiles`) |
| `wp_posts.post_type='sponsorship'` + meta | `sponsorships` |
| `wp_users` with `alhuffaz_sponsor` role | `auth.users` + `profiles(role='sponsor')` |
| `wp_alhuffaz_payments` | `payments` |
| `wp_alhuffaz_activity_log` | `activity_log` |
| Uploaded images (`wp-content/uploads/`) | Supabase Storage buckets |

### Key field conversions

- **Money** — v2 stores as decimal/float strings. Multiply by 100, cast
  to bigint.
- **Dates** — v2 uses MySQL `DATETIME` in local time. Convert to UTC
  `timestamptz`.
- **Rich text** — v2 has WP HTML. For v3, strip or sanitize (we are not
  using WP's content filters).
- **Attachment IDs** — v2 stores `wp_posts` attachment post IDs. In v3,
  we store storage paths. Requires downloading from v2 uploads → upload
  to Supabase Storage → store the path.

### Migration script skeleton

Write as a Node.js one-shot script, not inside the Next.js app. Outline:

```ts
// scripts/migrate-v2.ts
// 1. Connect to v2 MySQL (dump or read replica)
// 2. Connect to v3 Supabase using service role key
// 3. For each v2 user → create auth.users via admin API → insert profile
// 4. For each v2 student post → build payload from postmeta → insert
// 5. For each v2 sponsorship post → build payload → insert
// 6. For each v2 payment row → insert
// 7. For each v2 activity log row → insert
// 8. Download attachments → upload to Storage → update URLs
// 9. Print summary, errors
```

Run **on staging Supabase first**. Validate counts and spot-check 10
random records before running against prod.

### Known v2 quirks to handle

From the v2 commit log and `MIGRATION-LOG-*.md`:

- v2 had a legacy `alhuffaz_sponsor` CPT *and* a modern `sponsor` CPT —
  the legacy one was removed. Confirm no orphaned legacy rows remain
  before migrating.
- "Orphaned students from deleted sponsors" — v2 had a bug where deleting
  a sponsor user left `sponsorships` dangling. Clean those up before
  migration (or import them with `status='ended'`).
- Meta key renames happened: both old and new keys may exist for the
  same field (e.g. pending sponsorship counts). Prefer the newer key,
  fall back to old.
- Status values were sometimes stored as text ("Pending", "pending",
  "PENDING") — normalize to the enum.

### Rollback plan

- Run migration in a transaction per table where possible.
- Keep v2 up and reachable for 30 days after v3 launch.
- Store a migration report: source row count, inserted count, skipped
  with reason.

### Verification checks

After migration:

- [ ] `select count(*) from students` matches v2 active student count.
- [ ] `select count(*) from sponsorships where status='active'` matches
      v2 active sponsorships.
- [ ] `select sum(amount) from payments where status='verified'` matches
      v2 total verified payments (within rounding).
- [ ] Ten random sponsors can log in with a **new password** (we don't
      migrate password hashes — force password reset).
- [ ] Ten random student photos display correctly.

---

## Recommended approach

Unless data volume is large (>500 students or >5 years of payment
history), **go with Option A**. The time saved building a robust migration
is better spent building and polishing v3 itself.
