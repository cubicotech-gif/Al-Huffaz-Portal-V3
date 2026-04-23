# Al-Huffaz Education Portal — v3

Modern rewrite of the Al-Huffaz Islamic School education portal.
Replaces the previous WordPress plugin (v2) with a TypeScript / Next.js /
Supabase stack deployed on Cloudflare Pages.

> **New Claude sessions: read [`CLAUDE.md`](./CLAUDE.md) first.** It is the
> master memory/spec file and links to every detailed design doc under
> [`docs/`](./docs).

## Stack

| Layer             | Choice                                     |
| ----------------- | ------------------------------------------ |
| Framework         | Next.js 15 (App Router, Edge runtime)      |
| Language          | TypeScript                                 |
| Styling           | Tailwind CSS                               |
| Database          | Supabase (Postgres + Row Level Security)   |
| Auth              | Supabase Auth                              |
| File storage      | Supabase Storage (→ Cloudflare R2 later)   |
| Hosting           | Cloudflare Pages                           |
| Email             | Resend                                     |
| Payment gateway   | TBD (JazzCash / Easypaisa / Stripe)        |
| Domain            | Namecheap → DNS pointed at Cloudflare      |

## Quick start

```bash
# install deps
npm install

# copy env file and fill values
cp .env.example .env.local

# run dev server
npm run dev
# → http://localhost:3000

# type-check
npm run typecheck

# preview the Cloudflare Pages build locally
npm run pages:preview

# deploy to Cloudflare Pages
npm run pages:deploy
```

## Deploy (first time)

1. Create a Cloudflare account and a new Pages project.
2. Connect this repo → Cloudflare Pages (GitHub integration).
3. Build config:
   - **Build command:** `npx @cloudflare/next-on-pages@latest`
   - **Output directory:** `.vercel/output/static`
   - **Node version:** `20`
4. Add env vars (from `.env.example`) in the Cloudflare Pages dashboard.
5. Point your Namecheap domain at Cloudflare via DNS.

See [`docs/07-deployment.md`](./docs/07-deployment.md) for the step-by-step.

## Structure

```
portal-v3/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/health/       # Simple health check
│   ├── layout.tsx
│   ├── page.tsx          # Hello / first-deploy landing
│   └── globals.css
├── lib/
│   └── supabase/         # Supabase client (browser + server)
├── docs/                 # Detailed specs — read these before building
├── public/               # Static assets
├── CLAUDE.md             # Master memory file for future AI sessions
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── wrangler.toml         # Cloudflare Pages config
└── package.json
```

## What exists right now

Only the hello/landing page and a health check. Everything else is to be
built — see [`docs/08-phased-plan.md`](./docs/08-phased-plan.md) for the
phased rollout.
