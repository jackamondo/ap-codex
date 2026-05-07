// snippets.ts — joins the snippet content collection with the category manifest.
//
// Pages consume the helpers in this file rather than poking at the content
// collection directly, so category resolution stays in one place.

import { getCollection, type CollectionEntry } from 'astro:content';
import { loadCategories, findCategoryForSnippet, type Category } from './categories';

export type SnippetEntry = CollectionEntry<'snippets'>;

/**
 * A snippet plus its resolved category — handy shape for cards, sidebar items,
 * and the command palette.
 */
export interface SnippetWithCategory {
  entry: SnippetEntry;
  category: Category;
}

/** All snippets, deduped, with category resolved. Skips snippets that aren't
 *  registered in `categories.yaml` (a common mistake when adding a new file). */
export async function getAllSnippets(): Promise<SnippetWithCategory[]> {
  const all = await getCollection('snippets');
  const out: SnippetWithCategory[] = [];
  for (const entry of all) {
    const category = findCategoryForSnippet(entry.id);
    if (!category) {
      console.warn(`[snippets] "${entry.id}" is not listed in any category in categories.yaml — skipping.`);
      continue;
    }
    out.push({ entry, category });
  }
  return out;
}

/** Sidebar groups: every category that has at least one snippet, in manifest order. */
export async function getSidebarGroups(): Promise<Array<Category & { snippets: SnippetEntry[] }>> {
  const all = await getCollection('snippets');
  const byId = new Map(all.map((s) => [s.id, s]));

  return loadCategories()
    .map((category) => ({
      ...category,
      snippets: category.items
        .map((id) => byId.get(id))
        .filter((s): s is SnippetEntry => s !== undefined),
    }))
    .filter((group) => group.snippets.length > 0);
}

/** Look up one snippet + its category. Returns null if either is missing. */
export async function getSnippet(id: string): Promise<SnippetWithCategory | null> {
  const all = await getCollection('snippets');
  const entry = all.find((s) => s.id === id);
  if (!entry) return null;
  const category = findCategoryForSnippet(entry.id);
  if (!category) return null;
  return { entry, category };
}
