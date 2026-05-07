# Multi-stage build:
#   1. `build` — install deps, run `npm run build` (which prebuilds the
#      commit-history JSON via `git log`), produce `dist/`
#   2. `serve` — copy `dist/` into a tiny Caddy image and serve as static files
#
# Why Caddy over `node serve`:
#   - No Node runtime in production = smaller image, fewer CVEs
#   - Built-in compression + sane defaults
#   - Uses Railway's `$PORT` env var without extra wiring
#
# Why `git` is installed in the build stage:
#   `scripts/sync-content.mjs` shells out to `git log --follow` for each
#   snippet to populate the on-page commit history. The Alpine Node image
#   is minimal and doesn't include git by default.

FROM node:22-alpine AS build
RUN apk add --no-cache git
WORKDIR /app

# Copy lockfile + manifest first so dep install is cached across rebuilds
# whenever only content changes.
COPY package*.json ./
RUN npm ci

# Copy the rest, including .git (kept by .dockerignore so git log works).
COPY . .
RUN npm run build


FROM caddy:2-alpine AS serve
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
