# Reinnovation Homes — Investor Deal Portal

Live at **https://portal.worktopcrm.com** — the ZGH Holdings flip portfolio,
updated live for investors and followers.

Stack: **React + Vite + TypeScript + Tailwind**, **Supabase** (auth, Postgres,
storage), deployed as a static site on **Cloudflare Pages**.

## What it does

- **Public portfolio** — anyone can browse public deals: live status board
  (to-do / complete / red alerts), photos & video, financial strip (purchase
  lien + rehab lien with drawn/undrawn, ARV with LTARV badge, realtor
  fees/interest/closing costs at 8.5% of ARV, projected cash at close), cash
  reserves (3 months of payments + 15% of rehab budget), and a CSV budget
  viewer that renders spreadsheets as tables in the site.
- **Private deals** — deals default to private; visibility is enforced by
  database rules. Grant access per-email in Admin → Audience & access; the
  grant applies as soon as that person signs in with the email.
- **Lead capture** — per-deal "Partner on this deal" inquiry form (works
  signed-out), an email-capture bar with marketing checkboxes, and a
  once-per-session partner promo. Everything lands in the admin views.
- **Admin** (role-gated + RLS-enforced) — manage deals, the status board,
  media (cover photos), documents/invoices/CSVs, inquiries, subscribers, and
  the per-deal access grid.
- Red-alert deals show a gentle bottom-left "Financing open" card (15% of the
  rehab budget ask) instead of a blocking popup.

## Setup (fresh project)

1. Create a Supabase project, run [`supabase/schema.sql`](./supabase/schema.sql)
   in the SQL Editor.
2. `cp .env.example .env` and fill in the project URL + anon key
   (Project Settings → API).
3. `npm install && npm run dev`
4. Sign up in the app, then promote yourself:
   `update public.profiles set role = 'admin' where email = 'you@example.com';`
5. In Supabase **Authentication → URL Configuration** set the Site URL to your
   deployed domain and add `https://<your-domain>/**` to Redirect URLs so
   password-reset emails land correctly.

### Upgrading an existing database

Older live projects: run [`supabase/upgrade-2026-08.sql`](./supabase/upgrade-2026-08.sql)
then [`supabase/upgrade-2026-08b.sql`](./supabase/upgrade-2026-08b.sql), once
each, in order. Both are safe to re-run.

## Deploy (Cloudflare Pages)

Connect this repo, build command `npm run build`, output `dist`, and set
`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` as environment variables.
Attach the domain under Custom domains. `public/_redirects` handles SPA
routing.

## Where things are configured

- `src/lib/site.ts` — site name, contact phone/email, Facebook links, partner
  minimum, selling-cost rate (8.5%), reserve rates (1%/mo × 3 + 15%).
- `src/index.css` — brand palette and animations.
- `src/components/Logo.tsx` + `public/favicon.svg` — the Re roofline mark.

## Everyday use

- Admin → deal → "Currently working on" drives the live "Now:" line on cards.
- Upload a cover photo per deal (Photos & video → Set cover) — cards, deal
  pages, and the film-strip showcase all pull from it.
- New deals start private; tick "Public" to publish, or grant individual
  emails in Audience & access.
- All investor-facing numbers (LTARV, cash at close, reserves, lien split)
  compute from ARV / lien / rehab budget / rehab spent — keep those four
  current and everything else follows.
