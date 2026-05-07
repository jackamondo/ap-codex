# ap-codex

## Stack

- **[Astro](https://astro.build)** — static site, no Node server needed
- **React** — used only for the ⌘K palette island
- **Cloudflare Access** in front of the Railway origin for employee-only gating
- **Railway** for hosting (Docker container with Caddy serving `dist/`, redeployed on push to `main`)

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway + Cloudflare Access setup.

## Local development

```sh
npm install
npm run dev
```

Open http://localhost:4321. Edit a `.md` file under `content/` and the dev server hot-reloads.

`npm run build` builds the static site to `dist/`. Both `dev` and `build` re-run `scripts/sync-content.mjs` first to capture `git log` per snippet — see [Commit history](#commit-history).

## Project layout

```
content/                   # Snippet markdown files (one .md per snippet)
├── categories.yaml        # Sidebar manifest — controls category labels + ordering
├── getting-started/
│   ├── introduction.md
│   └── how-to-use.md
├── header/
│   └── …
└── …                      # one folder per category

src/
├── content.config.ts      # Zod schema + glob loader for the snippets collection
├── env.d.ts
├── layouts/Codex.astro    # 3-column app shell
├── pages/
│   ├── index.astro        # Library
│   └── [id].astro         # Snippet detail (one route per snippet)
├── components/            # Server-rendered Astro components
├── islands/               # React islands (just CommandPalette for now)
├── lib/
│   ├── categories.ts      # Reads content/categories.yaml
│   ├── commits.ts         # Reads src/data/commits.json
│   ├── config.ts          # Site-wide constants + env config
│   ├── format.ts          # Date helpers
│   └── snippets.ts        # Joins snippets ↔ categories
└── styles/
    ├── tokens.css         # Design tokens (colors, type, gradients) + reset
    ├── layout.css         # App shell + structural columns
    └── components.css     # Reusable UI atoms + page styles

scripts/sync-content.mjs   # Runs `git log` per snippet, writes commits.json
design/                    # The original design prototype — kept for reference, not shipped.
```

## Adding a snippet

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor flow — markdown format, frontmatter contract, and the `categories.yaml` registration step.

## Commit history

Each snippet page shows the `git log` for its source file. `scripts/sync-content.mjs` runs `git log --follow --pretty=…` per `.md` and writes the parsed result to `src/data/commits.json`. The `[id].astro` page reads that JSON at render time. The script runs automatically as `predev` and `prebuild`; trigger manually with `npm run sync-content` if you've committed in another terminal during dev.