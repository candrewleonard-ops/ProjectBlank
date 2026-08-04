# Cornerstone — Investor Deal Portal

A simple, live-updating portal where your investors and followers sign in and
see the status of every active deal: what's complete, what's still to do, and
any red-alert items (with a reason). Each deal has its own page with photos &
video, PDFs, invoices, and a "Deal Information" template (address, year
built, exterior, ARV, lien/rehab budget, budget variance).

Stack: **React + Vite + TypeScript + Tailwind**, **Supabase** (auth, Postgres
database, file storage), deployed as a static site on **Cloudflare Pages**.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (the
   free tier is enough to start).
2. Open **SQL Editor** in the Supabase dashboard, paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:
   - `profiles` (auto-created for every signed-up user, `role` is `investor`
     by default)
   - `deals`, `deal_tasks`, `deal_media`, `deal_documents`
   - Row Level Security so any signed-in user can **read** everything, but
     only an `admin` profile can **write**
   - two storage buckets: `deal-media` (public, for photos/video) and
     `deal-documents` (private, PDFs & invoices served through short-lived
     signed URLs)
3. In **Project Settings -> API**, copy the **Project URL** and the
   **anon public key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Install and run:

```bash
npm install
npm run dev
```

## 3. Make yourself an admin

Sign up in the app once (Sign up tab on the login screen), then in the
Supabase **SQL Editor** run:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Sign out and back in. You'll now see an **Admin** tab where you can create
deals, upload photos/video, upload PDFs and invoices, and update the status
board (To do / Complete / Red alert). Everyone else who signs up is a
read-only investor.

Supabase's client SDK persists the session in the browser automatically, so
signed-in users stay signed in across visits until they explicitly sign out.

## 4. How it's organized

- **Dashboard** (`/`) — a grid of active deals. Only the first deal's cover
  photo loads eagerly; every other image (including full galleries) is lazy
  loaded so the page stays fast even with many deals.
- **Deal page** (`/deals/:slug`) — one page per deal with four tabs:
  **Overview** (status board), **Photos & Video** (lazy-loaded gallery,
  fetched only when the tab is opened), **Deal Information** (the property
  template + PDFs), **Invoices**.
- **Red alerts** — mark a deal "illiquid" in the admin panel and add a reason
  (e.g. "Illiquid Project"). Investors see a persistent banner on the deal
  page plus a one-time-per-session pop-up with a "Contact us about
  financing" call to action. It won't nag them on every visit — once
  dismissed, it stays dismissed for that browser session.

To re-brand, edit `src/lib/site.ts` (site name, tagline, contact email).

## 5. Deploy to Cloudflare Pages

This is a static single-page app — no server required.

1. Push this repo to GitHub (or GitLab).
2. In the Cloudflare dashboard: **Workers & Pages -> Create -> Pages ->
   Connect to Git**, and pick this repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add the two environment variables from your `.env` (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) under **Settings -> Environment variables**.
5. Deploy. Then attach your domain under **Custom domains** — since
   Cloudflare already manages your domain's DNS, this is a couple of clicks.

`public/_redirects` is already set up so client-side routes like
`/deals/some-deal` work on refresh and direct link.

## 6. Upgrading an existing live site

If your Supabase project was created before the inquiries/current-focus
update, run [`supabase/upgrade-2026-08.sql`](./supabase/upgrade-2026-08.sql)
once in the SQL Editor. It adds the new deal fields, the investor-inquiry
table, and public (logged-out) read access to match the public site.

## 7. Everyday use

- Add a new deal in **Admin -> New deal**, fill in the property template,
  save, then upload photos/video and documents from the same page.
- Update the status board any time — investors see the change on their next
  page load, no redeploy needed (it's all live data from Supabase).
- Flip "This deal is illiquid" on/off any time to control the alert pop-up
  and banner.
