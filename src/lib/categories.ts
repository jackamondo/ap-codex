// categories.ts — read the sidebar category manifest from `content/categories.yaml`.
//
// The manifest defines:
//   - the order of categories in the sidebar
//   - the human-readable label for each category
//   - the order of snippets within each category
//
// This is the source of truth for sidebar layout. Adding a new snippet
// requires both dropping the .md AND appending its id to the right
// category's `items` list in the yaml.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

export interface Category {
  /** Folder name under `content/` and the canonical category id. */
  id: string;
  /** Human-readable label shown in the sidebar group header. */
  label: string;
  /** Ordered list of snippet ids (filename without `.md`) inside this category. */
  items: string[];
}

const CATEGORIES_PATH = resolve(process.cwd(), 'content/categories.yaml');

// Cache so we don't re-read + re-parse the yaml for every page render.
let cache: Category[] | null = null;

export function loadCategories(): Category[] {
  if (cache) return cache;
  const raw = readFileSync(CATEGORIES_PATH, 'utf8');
  cache = parse(raw) as Category[];
  return cache;
}

/** Look up the category that a given snippet id lives in. */
export function findCategoryForSnippet(snippetId: string): Category | null {
  return loadCategories().find((cat) => cat.items.includes(snippetId)) ?? null;
}
