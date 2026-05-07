// scripts/sync-content.mjs
//
// Build-time content sync. For every snippet markdown file under `content/`,
// runs `git log --follow` to capture the commit history of that file and
// writes the result to `src/data/commits.json`, keyed by snippet id.
//
// The snippet detail page imports this JSON and passes the commits for the
// current snippet to <CommitList>. Splitting the work like this keeps the
// runtime render path purely synchronous (no shelling out from inside Astro).
//
// Usage: `node scripts/sync-content.mjs` (or `npm run sync-content`).
// Runs automatically before `npm run dev` and `npm run build`.

import { execFile } from 'node:child_process';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { basename, join, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

// ---- Paths --------------------------------------------------------------

const REPO_ROOT = process.cwd();
const CONTENT_DIR = join(REPO_ROOT, 'content');
const OUT_DIR = join(REPO_ROOT, 'src/data');
const OUT_FILE = join(OUT_DIR, 'commits.json');

// `git log --pretty=format:` placeholders:
//   %h  abbreviated sha
//   %aI author date in strict ISO 8601
//   %s  subject (single line)
// Pipe-delimited so we can split safely; subject can still contain pipes,
// which is why we split with a `limit` of 3 fields and rejoin the rest.
const PRETTY = '%h|%aI|%s';

// ---- Helpers ------------------------------------------------------------

/**
 * Recursively collect every `.md` file under a directory.
 * Synchronous logic but we use the async fs API to play nicely with Node ESM.
 */
async function findMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findMarkdownFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(path);
    }
  }
  return out;
}

/**
 * Run `git log --follow` for one file. Returns commits newest-first.
 * `--follow` keeps history when the file was renamed; the path is given
 * relative to the repo root so git can resolve it from `cwd`.
 */
async function gitLogForFile(absolutePath) {
  const repoRelativePath = relative(REPO_ROOT, absolutePath);

  let stdout;
  try {
    ({ stdout } = await execFileP(
      'git',
      ['log', '--follow', `--pretty=format:${PRETTY}`, '--', repoRelativePath],
      { cwd: REPO_ROOT, maxBuffer: 4 * 1024 * 1024 }
    ));
  } catch (err) {
    // Most common reasons: file not yet committed, or this isn't a git repo.
    // Either way we don't want to fail the whole sync — just emit a warning.
    console.warn(`[sync-content] git log failed for ${repoRelativePath}: ${err.message}`);
    return [];
  }

  if (!stdout.trim()) return [];

  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // Split into at most 3 chunks so a "|" in the subject doesn't corrupt parsing.
      const [sha, date, ...rest] = line.split('|');
      return {
        sha: sha.trim(),
        date: date.trim(),
        message: rest.join('|').trim(),
      };
    });
}

// ---- Main ---------------------------------------------------------------

async function main() {
  console.log(`[sync-content] repo: ${REPO_ROOT}`);

  const files = await findMarkdownFiles(CONTENT_DIR);
  console.log(`[sync-content] found ${files.length} markdown file(s)`);

  // Snippet ids are flat (filename without .md), matching the Astro content
  // collection's `generateId`. If two folders ever contain a snippet with the
  // same basename, the last one wins here — and the content collection would
  // also flag it, so it's effectively guarded upstream.
  const commits = {};
  for (const file of files) {
    const id = basename(file, '.md');
    commits[id] = await gitLogForFile(file);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(commits, null, 2) + '\n', 'utf8');

  const totalCommits = Object.values(commits).reduce((n, list) => n + list.length, 0);
  console.log(
    `[sync-content] wrote ${OUT_FILE} — ${Object.keys(commits).length} snippet(s), ${totalCommits} commit(s) total`
  );
}

main().catch((err) => {
  console.error('[sync-content] FAILED:', err);
  process.exit(1);
});
