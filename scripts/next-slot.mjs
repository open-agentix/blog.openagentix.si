#!/usr/bin/env node
// Computes the next free publication slot: a Tuesday or Thursday at 07:00 Europe/Berlin.
//
//   node scripts/next-slot.mjs [--json] [--now <ISO>] [--dir <posts dir>]
//
// "Free" means strictly after now AND strictly after every date already used by a post, so a
// queue of scheduled posts is never overwritten and a slot is never used twice. English and German
// versions of a post share one date, so they occupy one slot together.
import { pathToFileURL } from 'node:url';
import { readPostDates } from './post-dates.mjs';

export const SLOT_TIME_ZONE = 'Europe/Berlin';
export const SLOT_HOUR = 7;
/** Tuesday and Thursday (0 = Sunday). */
export const SLOT_WEEKDAYS = [2, 4];
const SEARCH_DAYS = 21;
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const zoneFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: SLOT_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** Offset of Europe/Berlin from UTC at an instant, in minutes (60 in winter, 120 in summer). */
function zoneOffsetMinutes(ms) {
  const p = Object.fromEntries(zoneFormat.formatToParts(new Date(ms)).map((x) => [x.type, Number(x.value)]));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** The instant at which a Berlin wall clock reads `SLOT_HOUR:00` on the given calendar day. */
function slotInstant(year, month, day) {
  const wall = Date.UTC(year, month, day, SLOT_HOUR);
  // Two passes settle the offset even on the day the clocks change (07:00 is never in the gap).
  const first = wall - zoneOffsetMinutes(wall) * 60000;
  return wall - zoneOffsetMinutes(first) * 60000;
}

/** Formats an instant as ISO 8601 with the Berlin offset, e.g. `2026-10-13T07:00:00+02:00`. */
export function formatBerlin(ms) {
  const offset = zoneOffsetMinutes(ms);
  const local = new Date(ms + offset * 60000).toISOString().slice(0, 19);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${local}${sign}${hh}:${mm}`;
}

function toMs(value, what) {
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) throw new Error(`invalid ${what}: ${String(value)}`);
  return ms;
}

/**
 * @param {{ dates: readonly (string | Date)[], now: string | Date }} input
 *   `dates` are the dates of all existing posts (past, current and scheduled).
 * @returns {{ slot: string, instant: string, weekday: string }}
 */
export function nextSlot({ dates, now }) {
  const floor = Math.max(toMs(now, 'now'), ...dates.map((d) => toMs(d, 'post date')));
  const offset = zoneOffsetMinutes(floor);
  const start = new Date(floor + offset * 60000);
  for (let i = 0; i < SEARCH_DAYS; i += 1) {
    const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
    if (!SLOT_WEEKDAYS.includes(day.getUTCDay())) continue;
    const instant = slotInstant(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
    if (instant > floor) {
      return { slot: formatBerlin(instant), instant: new Date(instant).toISOString(), weekday: WEEKDAY_NAMES[day.getUTCDay()] };
    }
  }
  throw new Error('no slot found'); // unreachable: every 21-day window has Tuesdays and Thursdays
}

function parseArgs(argv) {
  const args = { json: false, now: undefined, dir: 'src/content/posts' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--now') args.now = argv[++i];
    else if (argv[i] === '--dir') args.dir = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return args;
}

function main(argv) {
  const args = parseArgs(argv);
  const now = args.now ?? new Date().toISOString();
  const dates = readPostDates(args.dir).map((p) => p.date);
  const result = nextSlot({ dates, now });
  process.stdout.write(`${args.json ? JSON.stringify({ ...result, now, posts: dates.length }) : result.slot}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`next-slot: ${error.message}\n`);
    process.exit(1);
  }
}
