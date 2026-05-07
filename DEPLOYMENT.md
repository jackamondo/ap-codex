# Deployment

ap-codex deploys as a static site, gated behind Cloudflare Access for employee-only access.

```
GitHub (main)
    │  push
    ▼
Railway   (builds Dockerfile, runs Caddy on $PORT)
    ▲
    │  CNAME
Cloudflare  (Zero Trust Access policy → Google SSO)
    ▲
    │  https
  Browser
```

The flow: a user hits `codex.appamondo.com`, Cloudflare intercepts, requires Google login + email-domain match, then forwards to the Railway origin. Railway runs the Docker image, which serves the prebuilt `dist/` via Caddy.

## One-time setup

### 1 — Connect Railway to GitHub

1. Sign into Railway, **New Project** → **Deploy from GitHub repo** → select `ap-codex`.
2. Railway detects the `Dockerfile` (via [`railway.json`](railway.json)) and builds.
3. The first build takes ~2 minutes. Once green, Railway gives you a public URL like `ap-codex-production.up.railway.app`. Open it and confirm the Library page renders.

Auto-deploy on every push to `main` is enabled by default.

### 2 — Set the env var

In Railway → your service → **Variables**:

| Name              | Value                                          |
| ----------------- | ---------------------------------------------- |
| `PUBLIC_REPO_URL` | `https://github.com/<your-org>/ap-codex`       |

This URL is baked into the static build (it's `import.meta.env.PUBLIC_*`), so changing it triggers a fresh deploy. It's used by the "View on GitHub" link in the meta strip and by the commit-sha links in the history block.

### 3 — Cloudflare Access

You need the domain you're putting this on (e.g. `codex.appamondo.com`) to be on Cloudflare Zero Trust. If the domain isn't on Cloudflare yet, [add it as a site](https://dash.cloudflare.com) first — that's a separate one-time step that requires nameserver changes.

Once the domain is on Cloudflare:

1. In the Cloudflare dashboard for the domain, **DNS** → add a record:
   - Type: `CNAME`
   - Name: `codex`
   - Target: `<your-service>.up.railway.app` (from step 1)
   - Proxy status: **proxied** (orange cloud)
2. **Zero Trust** → **Settings** → **Authentication** → add an identity provider:
   - **Google Workspace** if your team's on Google
   - or **One-time PIN** for a quick start without SSO setup
3. **Zero Trust** → **Access** → **Applications** → **Add an application**:
   - Type: **Self-hosted**
   - Application domain: `codex.appamondo.com`
   - Session duration: 24 hours (or whatever feels right)
4. Add a policy on that application:
   - Action: **Allow**
   - Include rule: `Emails ending in @appamondo.com`
   - (Optionally also allow specific contractor emails as a separate include rule)
5. Save.

Visit `codex.appamondo.com`. Cloudflare should challenge you for login, you authenticate via Google, and the site loads.

## What happens on every push to `main`

1. Railway pulls the new commit.
2. Docker build:
   - `npm ci` (cached unless `package*.json` changed)
   - `npm run build` → runs `prebuild` → `sync-content.mjs` runs `git log --follow` over every `content/**/*.md` to refresh `src/data/commits.json` → `astro build` produces `dist/`.
3. Final image is the Caddy serve stage.
4. Railway swaps traffic over once the new container passes its `/` healthcheck.

Cloudflare in front never sees a deploy interruption — it just proxies to whichever container Railway has live.

## Verifying a deploy locally

You can run the production-shaped build on your laptop:

```sh
docker build -t ap-codex .
docker run --rm -p 8080:80 ap-codex
# → http://localhost:8080
```

This is what Railway runs (no surprises between local Docker and prod).

## Things to know

- **Content edits don't need a special trigger** — they go through the same `git push origin main` → Railway redeploy path as code edits. Single repo, single workflow.
- **The commit-history block lags one deploy behind a push.** History is captured at *build time*, so a snippet's latest commit appears on the page only after the build that includes that commit completes.
- **If a build fails**, Railway keeps serving the last good image. Check the Railway build log (most common cause: a `.md` with bad frontmatter — Zod errors print the offending file path).
- **Cloudflare Access logs** every authentication attempt under Zero Trust → Logs → Authentication. Useful for spotting account issues.
