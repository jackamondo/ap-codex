// Snippet content collection.
//
// Snippets are markdown files under `content/`, organized into category
// folders (e.g. `content/header/hide-signin-link.md`).
//
// Snippet ids are flat (e.g. `hide-signin-link`), derived from the filename
// without `.md`. The folder a file lives in (e.g. `header/`) is the category,
// resolved separately via `content/categories.yaml`.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { basename } from 'node:path';

const snippets = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './content',
    // Flat ids: `header/hide-signin-link.md` -> `hide-signin-link`.
    // The category comes from the folder, joined in via `categories.yaml`.
    generateId: ({ entry }) => basename(entry, '.md'),
  }),
  schema: z.object({
    title: z.string(),
    tags: z.array(z.string()),
    summary: z.string(),
    useCase: z.string(),
    // YAML auto-parses YYYY-MM-DD into a Date; coerce so either form works.
    updated: z.coerce.date(),
    related: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { snippets };
