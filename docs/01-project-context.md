# 01 — Project Context

## The organization
**Al-Huffaz Islamic School** — an Islamic education institution in
Pakistan. Offers general schooling plus Islamic studies (Hifz, Nazra,
Qaidah). Currency: **PKR** (Rs.). Grade levels range from KG-1 through
Class 3, plus levels and SHB/SHG tracks.

## The problem the portal solves
The school has two populations of students:

1. **Paying students** — families pay tuition directly.
2. **Donation-eligible students** — children from lower-income families
   whose fees are covered by donors ("sponsors"). Many sponsors are
   overseas Pakistani diaspora.

Before the portal, managing sponsorships was manual: spreadsheets,
emails, WhatsApp screenshots of bank receipts. The portal formalizes:

- Sponsor registration + vetting.
- A catalog of donation-eligible students for sponsors to choose from.
- A formal sponsorship request → admin approval flow.
- Payment submission with proof (screenshot) → admin verification.
- Ongoing communication, re-engagement, and reporting.

## Who uses the portal

| Role | Who | What they do |
|---|---|---|
| **Admin** | School management | Full access: students, sponsors, payments, staff, settings, reports |
| **Staff** | Teachers / office staff | Add & edit student records only |
| **Sponsor** | Approved donors | Browse students, request sponsorship, submit payment proofs |
| **Pending sponsor** | New registrants | Awaiting admin approval; limited view |

## Non-functional context

- **Scale (today):** small — dozens of students, tens of sponsors,
  hundreds of payments per year.
- **Scale (ambition):** could grow to hundreds of students and hundreds
  of active sponsors.
- **Geography:** admins in PK, sponsors worldwide (latency matters → CDN
  at edge is a real benefit of Cloudflare Pages).
- **Trust:** this system handles money. Audit trail and correctness matter
  more than fancy features.

## Anti-goals
- Not building a learning-management system. No quizzes, no video, no
  live classes.
- Not building accounting software. Payments are receipts-in, not a full
  general ledger.
- Not building a CRM. Notifications + email are enough.
