# Osprey

Site for [Osprey](https://github.com/Purplelotusec/Osprey) — SBOM + CISA KEV CLI.

## Deploy on Vercel (via GitHub)

1. Unzip this folder and push it to a new GitHub repository.
2. In [Vercel](https://vercel.com/new), **Import** that repo.
3. Leave the defaults:
   - **Install:** `npm install --omit=dev --no-audit --no-fund` (from `vercel.json`)
   - **Build:** `npm run build`
4. Set one environment variable (optional but recommended):
   - `VITE_AUTH_ENABLED` = `false`
5. Deploy. No database is required.

The homepage pulls the live CISA Known Exploited Vulnerabilities catalog at request time. The **Notes** page (`/blog/introducing-osprey`) is included.

## Local

```bash
npm install
npm run dev
```
