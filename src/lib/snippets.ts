// snippets.ts — joins the snippet content collection with the category manifest.
//
// Pages consume the helpers in this file rather than poking at the content
// collection directly, so category resolution stays in one place.

import { getCollection, type CollectionEntry } from 'astro:content';
import {
  loadCategories,
  loadSections,
  findCategoryForSnippet,
  type Category,
  type Section,
} from './categories';

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

/** A category with its snippets resolved (used inside sidebar sections). */
export interface SidebarCategory extends Category {
  snippets: SnippetEntry[];
}

/** A section with its non-empty categories resolved. */
export interface SidebarSection extends Omit<Section, 'categories'> {
  categories: SidebarCategory[];
}

/**
 * Sidebar tree: sections > categories > snippets, in manifest order.
 *
 * Sections without any non-empty categories are filtered out; categories
 * without any in-collection snippets are filtered out. So the sidebar
 * only renders structure that actually has content behind it — declaring
 * `integrations` ahead of having content there doesn't put a stranded
 * empty header in the rail.
 */
export async function getSidebarSections(): Promise<SidebarSection[]> {
  const all = await getCollection('snippets');
  const byId = new Map(all.map((s) => [s.id, s]));

  return loadSections()
    .map((section) => ({
      ...section,
      categories: section.categories
        .map((category) => ({
          ...category,
          snippets: category.items
            .map((id) => byId.get(id))
            .filter((s): s is SnippetEntry => s !== undefined),
        }))
        .filter((cat) => cat.snippets.length > 0),
    }))
    .filter((section) => section.categories.length > 0);
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
