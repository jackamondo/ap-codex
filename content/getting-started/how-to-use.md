---
title: How to use this codex
tags: [no-code]
summary: Search with ⌘K, browse by category or tag, copy code with the button on every block, contribute via a pull request.
useCase: New hires need a quick orientation before they start lifting recipes into customer themes.
updated: 2026-05-07
related: [introduction]
---

## Searching

Hit `⌘K` (or `Ctrl+K`) anywhere to open the command palette. Type a customer ask in plain language — e.g. *"hide sign in"* or *"lock the request form"* — and jump straight to the recipe.

- `↑` / `↓` move the highlighted result
- `↵` opens the highlighted snippet
- `esc` closes the palette

The empty palette shows the eight most relevant snippets, so you can browse without typing.

## Browsing

Three ways in, depending on how you like to navigate:

- **The Library** (the homepage) — every snippet as a card, filter by Category or Tag chips
- **The sidebar** — snippets grouped by category; click any title to jump straight in
- **A category page** — click a category label in the sidebar, or a breadcrumb on a snippet page, to see just the snippets in that category

## Reading a snippet

Each snippet page is laid out the same way:

- **Crumbs** at the top — `Codex / <Category> / <Title>`
- **Meta strip** — the last update date, a link to the source markdown on GitHub, and the snippet's tags
- **Use case + body** — the actual recipe
- **Related snippets** — other entries worth chaining together (when applicable)
- **Commit history** — every change to this snippet's source file, newest first, with the full message and author from `git log`

The right-rail **On this page** tracks your scroll position and highlights the section you're currently reading. Click any heading to jump there.

## Copying code

Every code block has a **Copy** button in its top-right. The file-path label on the left of that header (e.g. `templates/header.hbs`, `assets/style.css`) tells you exactly where the snippet belongs in the customer's theme.

## Theme

The sun / moon button in the top-right switches between light and dark. Your choice persists across sessions — the page won't flash between themes on reload.

## Contributing

Snippets live in this repo as markdown files under `content/<category>/<id>.md`. To add or edit one:

1. Drop a new `.md` file in the matching category folder.
2. Add the snippet's id (filename without `.md`) to the matching category's `items` list in `content/categories.yaml`.
3. Open a pull request. Once merged to `main`, the codex auto-rebuilds and your snippet goes live.

The full format spec — frontmatter fields, code-block file labels, the gotchas around renaming or duplicating ids — lives in `CONTRIBUTING.md` at the repo root.
