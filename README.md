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
