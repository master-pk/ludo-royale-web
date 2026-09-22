# Ludo Royale — website

Static site for Ludo Royale: Battle of Kings. Hosted on Cloudflare as Worker
static assets at **https://ludoroyale.everease.org** (domain `everease.org`,
Cloudflare-registered). The old GitHub Pages address,
`master-pk.github.io/ludo-royale-web`, keeps serving the same files until every
store listing and shipped build points at the new host.

## Pages

| File | Purpose | Who links to it |
|---|---|---|
| `/get`, `/ig`, `/yt`, `/rd`, `/fam`, `/get?s=<tag>` (worker.js, no file) | Store links that remember the source: Android → Google Play with a Play install referrer (`utm_source=<source>`, read by Firebase Analytics on first open — no app change); iPhone/iPad → App Store with Apple campaign parameters once `APPLE_PT` is set; desktop → the home page. `ig` instagram · `yt` youtube · `rd` reddit · `fam` friends and family · `get` direct · `get?s=whatsapp` any other lowercase tag | The founder, per channel. Share the SHORT form, e.g. `ludoroyale.everease.org/ig` |
| `index.html` | landing page, store badges | store listings ("Website") |
| `join.html` | invite landing (`?join=CODE`); the ONLY page the app claims as a deep link | every share link the game sends |
| `privacy.html` | privacy policy | both stores, in-app settings, store footer |
| `delete-account.html` | account deletion instructions | Play data-safety form |

Files the platforms read (must be served from this host, at the root):

- `.well-known/apple-app-site-association` — iOS universal links; claims `/join.html` only.
- `.well-known/assetlinks.json` — Android App Links; package + both signing fingerprints.
- `app-ads.txt` — AdMob authorised seller line. Google may also look at the root domain (`everease.org/app-ads.txt`), so keep a copy there.
- `_headers` — forces `Content-Type: application/json` on the two `.well-known` files (Apple rejects octet-stream).

## Hosting / deploy

- `wrangler.jsonc` is the whole config: `assets.directory = "./"`, no build step,
  `html_handling: "none"` so `/join.html` is served verbatim (it is the exact
  path the app claims and every invite carries — never let it redirect to `/join`).
- `.assetsignore` keeps `.git`, `.github` and this README out of the upload.
- Cloudflare's Git integration deploys `main` on push. Manual deploy:
  `npx wrangler deploy` (after `npx wrangler login`, or with
  `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` in the environment).
- Custom domain: project → Settings → Domains & Routes → `ludoroyale.everease.org`.
  Cloudflare manages the DNS record and the certificate.

## Secrets

Never commit tokens. Cloudflare credentials live outside the repo, alongside the
store keys: `~/.factory/cloudflare.env` (`CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`) or the `wrangler login` credential in `~/.wrangler`.

## Moving the app to this host (checklist) — DONE 2026-09-19

Every item below is complete: app builds from 1.0.96 claim both hosts, the
server default and live override point here, and both store consoles carry
the new URLs. The GitHub Pages copy only redirects now.

The host is named in the game and the server; changing it needs a build.
Claim BOTH hosts during the transition so old invite links keep working.

1. Android manifest: add an App Link `<data>` for `ludoroyale.everease.org` path `/join.html`.
2. iOS entitlements: add `applinks:ludoroyale.everease.org`.
3. Client `NetConfig.WEB_GAME_URL` and server `LINK_DEFAULTS.web_game_url` → `https://ludoroyale.everease.org/join.html`; live override `/config/links/web_game_url` (no build).
4. In-app privacy links (settings, store footer) → `https://ludoroyale.everease.org/privacy.html`.
5. Store consoles: Play contact website + privacy URL; App Store support/marketing/privacy URLs; Play data-safety deletion URL.
6. App Review notes text mentions the delete-account URL — update.

## Source tracking — two switches still to flip (founder)

1. **Click counting (Cloudflare):** enable Workers Analytics Engine once in the
   dashboard (Workers & Pages → Analytics Engine → Enable), then uncomment the
   `analytics_engine_datasets` line in `wrangler.jsonc` and deploy. From then on
   every tap is counted by source + platform + country, nothing personal. Query
   in the dashboard or with the SQL API (dataset `ludo_store_clicks`).
2. **iOS attribution (Apple):** App Store Connect → App Analytics → Campaigns →
   Generate campaign link; copy the `pt=` value and run
   `npx wrangler secret put APPLE_PT`, paste it, deploy. iOS installs per source
   then appear in App Store Connect's Campaigns report (never in Firebase — Apple
   does not pass it through).

Android needs neither: the install referrer flows through Google Play into
Firebase Analytics on its own. Check with
`python3 scripts/metrics_quick.py` in the game repo (acquisition source), or
GA → Acquisition → first user source.
