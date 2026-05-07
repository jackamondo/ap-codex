// categories.ts — read the sidebar manifest from `content/categories.yaml`.
//
// The manifest is a two-level structure: sections > categories > items.
//   - A section is a top-level domain (Zendesk Guide, Integrations, …).
//   - A category lives inside a section and groups related snippets
//     (Header & nav, Sunshine Conversations, …).
//   - An item is a snippet id (filename minus `.md`).
//
// This file owns the contract for reading that yaml and shaping it into
// typed objects. Pages and components consume the helpers here rather than
// poking at the yaml directly, so the format can evolve without touching
// every call site.

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

export interface Section {
  /** Stable id (e.g. `zendesk-guide`, `integrations`). */
  id: string;
  /** Human-readable label shown as the sidebar section header. */
  label: string;
  /** Categories nested inside this section, in declared order. */
  categories: Category[];
}

// Raw shape as it appears in categories.yaml — the yaml uses `section:` for
// the section's id. We re-key to `id` after parsing so the in-app shape is
// uniform with `Category`.
interface RawSection {
  section: string;
  label: string;
  categories?: Category[];
}

const CATEGORIES_PATH = resolve(process.cwd(), 'content/categories.yaml');

/**
 * All sections, in the order they appear in `categories.yaml`.
 *
 * No in-memory cache: the yaml is tiny (~few KB) and parsing it is
 * microseconds, so the per-render cost is negligible. Skipping the cache
 * means edits to `categories.yaml` hot-reload during `npm run dev` without
 * needing a restart.
 */
export function loadSections(): Section[] {
  const raw = readFileSync(CATEGORIES_PATH, 'utf8');
  const parsed = parse(raw) as RawSection[];
  return parsed.map((s) => ({
    id: s.section,
    label: s.label,
    categories: s.categories ?? [],
  }));
}

/** Flat list of every category across every section, preserving declared order. */
export function loadCategories(): Category[] {
  return loadSections().flatMap((s) => s.categories);
}

/** Find the category that owns a given snippet id, or null. */
export function findCategoryForSnippet(snippetId: string): Category | null {
  return loadCategories().find((cat) => cat.items.includes(snippetId)) ?? null;
}

/** Find the section that contains a given category id, or null. */
export function findSectionForCategory(categoryId: string): Section | null {
  return loadSections().find((s) =>
    s.categories.some((c) => c.id === categoryId)
  ) ?? null;
}
