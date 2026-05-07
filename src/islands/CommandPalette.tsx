// CommandPalette — ⌘K search modal.
//
// React island (the only one in the app right now). Lives at body root,
// listens globally for ⌘K / Ctrl+K and the `codex:open-palette` custom event
// (dispatched by the topbar search button).
//
// Search ranking (per the design spec):
//   title    × 10
//   summary  × 5
//   useCase  × 4
//   tags     × 3
//   category × 2
// Anything that scores 0 is filtered out. Ties are stable in input order.
//
// Empty query → top 8 snippets in input order, so opening the palette
// without typing always shows something.

import { useEffect, useMemo, useRef, useState } from 'react';

// -----------------------------------------------------------------------------

export interface PaletteSnippet {
  id: string;
  title: string;
  summary: string;
  useCase: string;
  tags: string[];
  categoryLabel: string;
}

interface Props {
  snippets: PaletteSnippet[];
}

const FIELD_WEIGHTS = {
  title: 10,
  summary: 5,
  useCase: 4,
  tags: 3,
  category: 2,
} as const;

const EMPTY_QUERY_LIMIT = 8;
const RESET_DELAY_MS = 150;

// -----------------------------------------------------------------------------

function rank(snippets: PaletteSnippet[], query: string): PaletteSnippet[] {
  const q = query.trim().toLowerCase();
  if (!q) return snippets.slice(0, EMPTY_QUERY_LIMIT);

  const scored = snippets.map((s) => {
    let score = 0;
    if (s.title.toLowerCase().includes(q)) score += FIELD_WEIGHTS.title;
    if (s.summary.toLowerCase().includes(q)) score += FIELD_WEIGHTS.summary;
    if (s.useCase.toLowerCase().includes(q)) score += FIELD_WEIGHTS.useCase;
    if (s.tags.some((t) => t.toLowerCase().includes(q))) score += FIELD_WEIGHTS.tags;
    if (s.categoryLabel.toLowerCase().includes(q)) score += FIELD_WEIGHTS.category;
    return { snippet: s, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.snippet);
}

function navigateTo(id: string): void {
  window.location.assign(`/${id}`);
}

// -----------------------------------------------------------------------------

export function CommandPalette({ snippets }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => rank(snippets, query), [snippets, query]);

  // Reset selection on every query change so the highlight stays sane as
  // the result set shrinks/grows.
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global open/close triggers — installed once on mount.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onCustomOpen() {
      setOpen(true);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('codex:open-palette', onCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('codex:open-palette', onCustomOpen);
    };
  }, []);

  // Open-state keyboard handlers — Esc / ↑ / ↓ / Enter. Re-attached when
  // results or selection change so the closure has fresh values.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) =>
          results.length === 0 ? 0 : (i - 1 + results.length) % results.length
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const target = results[selectedIndex];
        if (target) navigateTo(target.id);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, results, selectedIndex]);

  // Focus the input on open; clear state on close (after a short delay so
  // the closing animation doesn't show an instantly-empty input).
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    const timer = window.setTimeout(() => {
      setQuery('');
      setSelectedIndex(0);
    }, RESET_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={() => setOpen(false)} role="presentation">
      <div
        className="palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search snippets"
      >
        <div className="palette-input-row">
          <span className="topbar-search-icon" aria-hidden="true">
            <svg width={14} height={14} viewBox="0 0 24 24">
              <circle cx={11} cy={11} r={7} fill="none" stroke="currentColor" strokeWidth={2} />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth={2} />
            </svg>
          </span>
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search snippets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search snippets"
          />
        </div>

        {results.length === 0 ? (
          <div className="palette-empty">No matches for &ldquo;{query}&rdquo;</div>
        ) : (
          <ul className="palette-results" role="listbox" aria-label="Search results">
            {results.map((snippet, i) => {
              const isActive = i === selectedIndex;
              return (
                <li
                  key={snippet.id}
                  className={`palette-result${isActive ? ' is-active' : ''}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => navigateTo(snippet.id)}
                >
                  <span className="palette-result-title">{snippet.title}</span>
                  <span className="palette-result-cat">{snippet.categoryLabel}</span>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="palette-foot">
          <span className="palette-foot-item">
            <kbd className="kbd">↑↓</kbd> navigate
          </span>
          <span className="palette-foot-item">
            <kbd className="kbd">↵</kbd> open
          </span>
          <span className="palette-foot-item">
            <kbd className="kbd">esc</kbd> close
          </span>
        </footer>
      </div>
    </div>
  );
}
