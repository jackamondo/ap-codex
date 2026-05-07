# Contributing snippets

This is a PR-driven docs site. Adding or editing a snippet means opening a pull request.

## TL;DR

1. Add a `.md` file under `content/<category>/`
2. Write the frontmatter
3. Register the snippet's id under the right **section** → **category** in [`content/categories.yaml`](content/categories.yaml)
4. Open a PR

`npm run dev` hot-reloads while you work.

## How the library is organized

The sidebar has two levels of grouping:

- **Sections** — top-level domains (e.g. `Zendesk Guide`, `Integrations`, `Internal workflows`).
- **Categories** — sub-areas inside a section (e.g. `Header & nav` and `Request form` inside `Zendesk Guide`; `Sunshine Conversations` and `Webhooks` inside `Integrations`).

Both levels are declared in `content/categories.yaml`. Sections / categories without any in-collection snippets stay invisible in the sidebar — so you can declare an "Integrations" section ahead of having content for it without leaving an empty header in the rail.

## 1. Create the markdown file

```
content/<category>/<snippet-id>.md
```

The **folder** is the category. The **filename** (minus `.md`) becomes the snippet's id, which is also its URL slug.

```
content/footer/social-icons.md   →   /social-icons   (Footer category)
```

> **Heads up**: ids are flat across the whole repo, not folder-scoped. URLs look like `/social-icons`, not `/footer/social-icons`. If two `.md` files in different folders share a name, only the last one wins. Pick disambiguating names (e.g. `footer-social-icons`) if collisions are likely.

## 2. Write the frontmatter

```md
---
title: Social icon row in the footer
summary: One-line description shown on grid cards and as the lede.
useCase: Why this exists, in plain customer language.
tags: [css, footer]
updated: 2026-05-07
related: [custom-footer-links]   # optional
---

## Approach

Markdown body. H2 / H3 headings auto-build the right-rail TOC.
```

| Field      | Required | Notes                                                    |
| ---------- | -------- | -------------------------------------------------------- |
| `title`    | yes      | Shown as the H1 and on the sidebar / grid card.          |
| `summary`  | yes      | One sentence. Used as the lede + the card description.   |
| `useCase`  | yes      | Why this exists, in plain customer language.             |
| `tags`     | yes      | Free-form list. The first three show on grid cards.      |
| `updated`  | yes      | `YYYY-MM-DD`. Last meaningful change.                    |
| `related`  | no       | Array of other snippet ids. Bad ids are silently skipped, so a typo won't break the page. |

The schema in [src/content.config.ts](src/content.config.ts) validates this at build time — a missing or malformed field fails the build with a precise error pointing at the offending file.

## 3. Register in `content/categories.yaml`

This is the sidebar manifest. Find the right section, find the right category within it, append the snippet's id to that category's `items` list:

```yaml
- section: zendesk-guide
  label: Zendesk Guide
  categories:
    - id: footer
      label: Footer
      items:
        - custom-footer-links
        - social-icons      # ← add this
```

The order of `items` is the order shown in the sidebar.

> **Forget this and the snippet won't render anywhere.** A `.md` file that exists but isn't registered in `categories.yaml` triggers a build-time warning (`[snippets] "<id>" is not listed in any category — skipping.`) and gets dropped. This is the one easy step to miss.

## 4. Code blocks with file paths

In the markdown body, fenced code blocks support a `title="..."` meta string:

````md
```handlebars title="templates/footer.hbs"
{{!-- this renders as a labeled code block --}}
```
````

Rendered output: a code block with `templates/footer.hbs` in the header bar, the language as a chip on the right, and a working Copy button. Use the standard Shiki language names — `handlebars`, `css`, `javascript`, `html`, `liquid`, `bash`, etc.

## What you write vs. what's automatic

| You write | Auto-derived |
| --- | --- |
| Frontmatter fields | Category (from folder name) |
| Markdown body | URL slug (from filename) |
| `title="..."` on code fences | Commit history (from `git log --follow`) |
| Position in `categories.yaml` | TOC (from H2 / H3 in the body) |
|  | Filter chips on Library + sidebar groups (from what's in use) |
|  | Related-snippets cards (from `related` ids) |

## Gotchas

- **Removing a snippet**: delete the `.md` and remove its id from `categories.yaml`. Inbound links from other snippets' `related: [...]` lists will silently drop. External bookmarks to the URL will 404 — there's no redirect machinery yet.
- **Renaming a snippet**: changing the filename = changing the URL = breaking inbound bookmarks. `git log --follow` preserves commit history across renames, so the on-page history block stays intact. If a rename is unavoidable, do it deliberately and tell the team.
- **Adding a brand-new category**: append a new entry under the right section's `categories:` list in `categories.yaml` *and* create the matching folder under `content/`. Empty categories don't render anywhere until they have at least one snippet.
- **Adding a brand-new section**: append a new top-level entry to `categories.yaml` (with `section`, `label`, and an empty `categories:` array). The section won't appear in the sidebar until at least one of its categories has content — so it's safe to set up the structure ahead of writing snippets.

## Local dev

```sh
npm install
npm run dev
```

Open http://localhost:4321. Edit any `.md` under `content/` and the dev server hot-reloads.

The build-time `git log` index (`src/data/commits.json`) is regenerated automatically on `npm run dev` and `npm run build`. If you commit in a separate terminal during a dev session, run `npm run sync-content` (or restart `npm run dev`) to refresh the on-page commit history.
