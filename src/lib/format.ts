// format.ts — tiny formatting helpers used by templates.
//
// Keeping these here means a SnippetCard and a MetaStrip render dates the
// same way without each component re-implementing the format.

/**
 * Format a Date as `MMM D, YYYY` (e.g. "Apr 13, 2026").
 * `timeZone: 'UTC'` keeps the day stable regardless of the viewer's TZ —
 * frontmatter dates are parsed as midnight UTC and we want them to render
 * with that same day everywhere.
 */
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}

// Largest-unit-first list, mirroring how humans say "5 months ago" not "21 weeks ago".
const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * Format an ISO 8601 date string as a short relative-time string ("3 days ago").
 * Used in the commit history list. Negative durations (future dates) are
 * supported but unusual in this context.
 */
export function formatRelative(isoDate: string): string {
  const elapsedSeconds = (Date.now() - new Date(isoDate).getTime()) / 1000;
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(elapsedSeconds) >= secondsInUnit) {
      return RTF.format(-Math.round(elapsedSeconds / secondsInUnit), unit);
    }
  }
  return RTF.format(0, 'second');
}
