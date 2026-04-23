# 06 — Payments

## Current state (v2)

Payments are **manual**: sponsor makes a bank transfer externally,
uploads a screenshot + transaction ID through the portal, admin
verifies. No real payment gateway is integrated yet. This is the main
feature the owner wants to add in v3.

## Decision needed

Before Phase 4 (payment gateway integration), confirm with the owner:

1. **Donor geography.** What percentage of sponsors are:
   - Inside Pakistan?
   - International (overseas Pakistani diaspora)?
2. **Currencies.** PKR only, or also USD/GBP/etc. with auto-conversion?
3. **Volume.** Per-month payment count + average amount.
4. **Business registration.** Is the school registered as a company/NGO
   that can onboard with a local gateway? (Merchants need this for
   JazzCash/HBL merchant accounts.)

## Options

### For Pakistan-based sponsors

| Gateway | Pros | Cons |
|---|---|---|
| **JazzCash** (Merchant Services) | Most popular in PK, supports mobile wallet + CC, Urdu UI | Requires formal merchant onboarding, paperwork |
| **Easypaisa** | Similar reach to JazzCash | Same onboarding overhead |
| **HBL PayPass / 1Link** | Bank-backed, reliable | Less modern APIs |
| **Paymob** | Newer, clean API, supports multiple PK methods | Smaller brand recognition |
| **Safepay** (PK) | Modern SaaS for PK merchants, good docs | Commission rates |

### For international sponsors

| Gateway | Pros | Cons |
|---|---|---|
| **Stripe** | Gold standard, great DX, Next.js examples everywhere | **Stripe doesn't support PK merchants for receiving payouts** — would require a stripe account in a supported country (e.g. a UK/US entity) |
| **2Checkout / Verifone** | Accepts PK merchants, global cards | Higher fees, older API |
| **Wise Business** | Good for receiving international bank transfers | Not a "gateway" — semi-manual |

### Hybrid recommendation (likely)
- Keep the **manual screenshot flow** as the fallback.
- Add **one local gateway** for in-PK sponsors (JazzCash or Safepay most
  likely).
- Add **one international gateway** only if the school has a registered
  entity that can onboard (or stay manual for overseas for now).

## Architecture (provider-agnostic)

```
lib/payments/
├── provider.ts            # interface
├── providers/
│   ├── manual.ts          # screenshot-only (current behavior)
│   ├── jazzcash.ts        # stub until chosen
│   ├── safepay.ts         # stub
│   └── stripe.ts          # stub
└── webhook-handlers.ts
```

### Provider interface (sketch)

```ts
// lib/payments/provider.ts
export type InitiateArgs = {
  sponsorshipId: string;
  amount: number;       // minor units
  currency: string;
  sponsorEmail: string;
  returnUrl: string;
  cancelUrl: string;
};

export type InitiateResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'manual' }                              // screenshot flow
  | { kind: 'embedded'; clientSecret: string };     // e.g. Stripe

export interface PaymentProvider {
  id: string;
  initiate(args: InitiateArgs): Promise<InitiateResult>;
  verifyWebhook(req: Request): Promise<WebhookEvent | null>;
}
```

### Webhook flow (hosted gateways)

1. Gateway calls `POST /api/payments/webhook/<provider>`.
2. Handler verifies signature using provider's secret.
3. Extracts `sponsorship_id` from metadata → updates `payments.status`.
4. If verified, run the same transition code as manual verify.

### Local envs needed per provider

See `.env.example` — add per-provider keys as we integrate. Store real
secrets only in Cloudflare Pages env var settings, never in the repo.

## Money representation

- Always store in **minor units** (`bigint`): PKR → paise (×100),
  USD → cents (×100).
- Convert to display string at the edge with Intl:
  `new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount / 100)`
- Never store an amount-and-currency mismatch. Every payment row records
  the currency it was charged in.

## What the MVP must do

- Keep the manual screenshot flow (works, reliable, zero gateway fees).
- Add a **second payment method toggle** in the UI so we can plug in
  JazzCash or Stripe later without UI rework.
- Design the `payments` table to support both manual and gateway
  payments (already does — see `03-database-schema.md`).
