// Astro config for ap-codex — the Codex web app.
//
// React is enabled only for the small set of interactive islands
// (command palette, theme toggle, copy buttons, TOC scroll-spy).
// Everything else renders server-side as plain Astro components.
//
// `output: 'static'` — Cloudflare Access handles employee gating in front
// of the Railway origin, so the app itself ships as static HTML/CSS/JS.
//
// Markdown:
// - Shiki runs in dual-theme mode (one render, both light + dark colors as
//   CSS custom properties). The companion CSS rule in components.css picks
//   the right one based on `[data-theme]` on <html>.
// - `codexCodeBlock` is our transformer that wraps every rendered <pre> in
//   the `.code-block` chrome (file-path label, lang chip, copy button).

import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { codexCodeBlock } from './src/lib/code-block-transformer.ts';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  markdown: {
    shikiConfig: {
      // `github-dark` (not `-dimmed` / `-default`) is the higher-contrast
      // variant — strings, keywords, and functions all stay legible against
      // our `--bg-code` (#0d0d0d). Bundles via Astro's built-in Shiki.
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [codexCodeBlock],
    },
  },
});
