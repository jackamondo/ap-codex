// config.ts — small site-wide constants.
//
// Values that vary between environments live here so pages and components
// can import a single source of truth.

const env = import.meta.env;

export const SITE_CONFIG = {
  /** Display name in the topbar, page titles, and breadcrumbs. */
  appName: 'AP-Codex',
  /** Public URL of the repo (used for "View on GitHub" / commit links). */
  repoUrl: env.PUBLIC_REPO_URL ?? 'https://github.com/your-team/ap-codex',
} as const;
