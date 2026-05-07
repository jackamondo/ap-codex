// code-block-transformer.ts — Shiki transformer that wraps every rendered
// <pre> in our `.code-block` chrome.
//
// Why a Shiki transformer (rather than a rehype plugin)?
// Shiki transformers receive the *whole* hast subtree along with the original
// fence's meta string, so we can read `title="..."` and inject it into the
// header in a single pass. Doing this with a separate rehype plugin would
// require threading meta through somehow; doing it here keeps the logic
// localized.
//
// Output structure (per markdown fence):
//
//   <figure class="code-block">
//     <div class="code-head">
//       <span class="code-head-path">{title}</span>     ← only if `title="..."` in meta
//       <span class="code-head-lang">{lang}</span>
//       <button class="copy-btn" data-copy-button>…</button>
//     </div>
//     <pre class="astro-code code-body">…</pre>
//   </figure>
//
// The copy button is wired up by an inline script on the snippet page —
// see `src/pages/[id].astro`.

import type { Element, Properties, Root, Text, ElementContent } from 'hast';

interface TransformerContext {
  options: {
    lang?: string;
    meta?: { __raw?: string };
  };
}

/** Parse `title="path/to/file.css"` (single or double quoted) out of a fence's meta string. */
function readTitle(rawMeta: string): string {
  const match = rawMeta.match(/title=["']([^"']+)["']/);
  return match?.[1] ?? '';
}

/** Build a hast element shorthand. */
function el(tagName: string, properties: Properties, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties, children };
}
function txt(value: string): Text {
  return { type: 'text', value };
}

/** Inline clipboard SVG icon for the copy button. */
function clipboardIcon(): Element {
  return el(
    'svg',
    {
      width: 11,
      height: 11,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    },
    [
      el('rect', { x: 9, y: 9, width: 13, height: 13, rx: 2 }),
      el('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }),
    ]
  );
}

/** Build the `.code-head` row above the rendered <pre>. */
function buildHead(title: string, lang: string): Element {
  const headChildren: ElementContent[] = [];

  // File path label — only shown when the fence specified `title="…"`.
  // Always render the slot so the lang chip + copy button align even when there's no title.
  headChildren.push(
    el('span', { class: 'code-head-path' }, title ? [txt(title)] : [])
  );

  if (lang) {
    headChildren.push(el('span', { class: 'code-head-lang' }, [txt(lang)]));
  }

  headChildren.push(
    el(
      'button',
      {
        type: 'button',
        class: 'copy-btn',
        'data-copy-button': '',
        'aria-label': 'Copy code to clipboard',
      },
      [clipboardIcon(), el('span', { 'data-copy-label': '' }, [txt('Copy')])]
    )
  );

  return el('div', { class: 'code-head' }, headChildren);
}

/**
 * Strip Shiki's inline `background-color` from the <pre>'s style attribute so
 * our `.code-block` background is the one that wins. Shiki sets the bg color
 * inline; everything else (per-token colors via CSS variables) we keep.
 */
function stripBackground(pre: Element): void {
  const style = pre.properties?.style;
  if (typeof style !== 'string') return;
  const cleaned = style
    .split(';')
    .map((rule) => rule.trim())
    .filter((rule) => rule && !rule.startsWith('background-color'))
    .join('; ');
  pre.properties.style = cleaned || undefined;
}

export const codexCodeBlock = {
  name: 'codex:code-block',

  // `root` runs once per fenced code block, after Shiki has produced the
  // <pre><code>…</code></pre> hast subtree but before serialization. We
  // mutate `node.children` in place to wrap the <pre> in our chrome.
  root(this: TransformerContext, node: Root): void {
    const lang = this.options.lang ?? '';
    const rawMeta = this.options.meta?.__raw ?? '';
    const title = readTitle(rawMeta);

    const preIndex = node.children.findIndex(
      (child): child is Element => child.type === 'element' && child.tagName === 'pre'
    );
    if (preIndex === -1) return;

    const pre = node.children[preIndex] as Element;
    stripBackground(pre);

    // Add `.code-body` so existing component styles still target the <pre>.
    const existing = pre.properties?.className;
    const classes = Array.isArray(existing)
      ? existing
      : typeof existing === 'string'
        ? existing.split(/\s+/)
        : [];
    classes.push('code-body');
    pre.properties = { ...pre.properties, className: classes };

    const figure = el('figure', { class: 'code-block' }, [buildHead(title, lang), pre]);
    node.children[preIndex] = figure;
  },
};
