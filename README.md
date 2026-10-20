# RoamWise

Travel Rescue & True Cost, an English/Japanese travel companion that runs on GitHub Pages without paid AI or backend hosting.

## Features
- Quick Rescue: create a temporary itinerary, choose disruption and compare deterministic adjustments
- My Trips: locally saved and editable itineraries
- Weather: Open-Meteo (optional request, requires chosen city and supported forecast date)
- Reference currency conversion: Frankfurter (optional request)
- Cost breakdown, trip budget, potential missed-booking exposure
- Import/export JSON trip backups; browser storage uses IndexedDB
- Mobile responsive; EN / 日本語

## Development

```sh
npm install
npm run dev
npm run build
npm test
```

## Deploy to GitHub Pages

Create or use **notmuchapoet/roamwise** and push project files to `main`. In **Settings → Pages** choose **GitHub Actions**. `.github/workflows/deploy.yml` builds `dist/`. Public URL (after successful deployment): `https://notmuchapoet.github.io/roamwise/`.

## Limitations & privacy
- No account or cross-device sync. Data stored locally in browser IndexedDB; export backups regularly.
- Proposed schedules are deterministic suggestions, not live booking changes. Fixed bookings aren't automatically moved. Travel buffers and opening hours require manual checking.
- Weather forecasts may not cover future trips. Location search and weather API use Open-Meteo under its terms, especially free **non-commercial** access and attribution.
- Frankfurter exchange rates are reference rates, not actual bank/card rates. Currency conversion requires internet.
- Public location geocoding and weather requests reveal query city/coordinates to Open-Meteo; rates reveal currencies to Frankfurter. Trip contents are never sent to these providers.
- Not affiliated with any provider.

---
# Two-user login setup (Supabase Free)

RoamWise works without Supabase, using IndexedDB in one browser. To enable email/password login and synchronize trips across devices for two people, configure Supabase.

1. Create a project at https://supabase.com/dashboard on the free tier.
2. In **SQL Editor**, run [supabase/schema.sql](./supabase/schema.sql). This creates `trips` with row-level security, so **each user sees only their own trips**.
3. Under **Authentication → Providers → Email**, enable Email login. Configure the accounts using the Supabase dashboard (Authentication → Users → Invite user). Set Site URL to `https://notmuchapoet.github.io/RoamWise/` and allow that redirect URL in Authentication → URL Configuration. Invited users can follow the email setup link to set credentials; verify the configured email templates and redirect behavior before testing.
4. Under GitHub repository **Settings → Secrets and variables → Actions → Variables**, create:
   - `VITE_SUPABASE_URL`: Supabase project URL (for example `https://xxxxx.supabase.co`).
   - `VITE_SUPABASE_ANON_KEY`: Supabase **publishable** or legacy **anon** public key. **Never use the service_role/secret key.**
5. The deployment workflow must pass those two variables to the Vite build; when deployed with both values, the login screen is enabled. Without both values, RoamWise continues in local-only mode.
6. After creating the two users, **disable public sign-ups** under Supabase Authentication settings. This is an invitation-only app (the RoamWise login form intentionally has no sign-up button).

Important: Trips already saved to a browser in local mode are **not silently uploaded**. Export the JSON backup before enabling login; then sign in and import it. Each account's data is private, not automatically shared. Sharing between the two accounts would require separate explicit functionality and permissions.

Supabase free-tier limits may change; check the dashboard's current allowances. No AI tokens are required.
