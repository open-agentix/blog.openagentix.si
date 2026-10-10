import type { ContentProblem, PostMeta } from './posts';

export const approvals = ['none', 'approved', 'vetoed'] as const;
/**
 * Owner decision recorded in the post's front matter:
 * - `none` (default): the post goes live at its `date`;
 * - `approved`: released before its date, it keeps the date;
 * - `vetoed`: held back, also after its date, until the owner changes it. The files stay in the repository.
 */
export type Approval = (typeof approvals)[number];

type Dated = Pick<PostMeta, 'date' | 'approval'>;

const PREVIEW_NOW = new Date(8.64e15);
const SLOT_TIME_ZONE = 'Europe/Berlin';
const berlinDay = new Intl.DateTimeFormat('en-CA', { timeZone: SLOT_TIME_ZONE });

/**
 * The instant against which publication dates are compared. Only `PREVIEW_FUTURE=1` changes it,
 * and it exists for local preview; the deploy builds never set it.
 */
export function effectiveNow(env: Record<string, string | undefined>, clock: () => Date = () => new Date()): Date {
  return env['PREVIEW_FUTURE'] === '1' ? PREVIEW_NOW : clock();
}

/** Vetoed posts are never live; approved posts are live before their date; all others at their date. */
export function isPublished(post: Dated, now: Date): boolean {
  if (post.approval === 'vetoed') return false;
  if (post.approval === 'approved') return true;
  return post.date.getTime() <= now.getTime();
}

/** Posts that are live at `now`. Everything the site renders or lists goes through this filter. */
export function publishedPosts<T extends Dated>(posts: readonly T[], now: Date): T[] {
  return posts.filter((p) => isPublished(p, now));
}

/**
 * Earliest instant after `now` at which a post goes live by itself, or null. Approved and vetoed
 * posts do not count: the first is live already, the second waits for a human.
 */
export function nextPublishAt(posts: readonly Dated[], now: Date): Date | null {
  const upcoming = posts
    .filter((p) => (p.approval ?? 'none') === 'none')
    .map((p) => p.date.getTime())
    .filter((t) => t > now.getTime());
  return upcoming.length > 0 ? new Date(Math.min(...upcoming)) : null;
}

type PairPost = Pick<PostMeta, 'ref' | 'lang' | 'date' | 'approval'>;

/**
 * Both language versions of a post go live together: same instant, same approval. And one post (pair)
 * per day: two different refs on one Berlin calendar day are refused.
 */
export function validateSchedule(posts: readonly PairPost[]): ContentProblem[] {
  const first = new Map<string, PairPost>();
  const problems: ContentProblem[] = [];
  for (const p of posts) {
    const seen = first.get(p.ref);
    if (!seen) {
      first.set(p.ref, p);
      continue;
    }
    if (seen.date.getTime() !== p.date.getTime()) {
      problems.push({ ref: p.ref, message: `${seen.lang} and ${p.lang} versions have different dates; a pair must share one publication date` });
    }
    if ((seen.approval ?? 'none') !== (p.approval ?? 'none')) {
      problems.push({ ref: p.ref, message: `${seen.lang} and ${p.lang} versions have different approval; a pair is released or held back together` });
    }
  }
  const dayOwner = new Map<string, string>();
  for (const [ref, p] of first) {
    const day = berlinDay.format(p.date);
    const other = dayOwner.get(day);
    if (other) problems.push({ ref, message: `shares the publication day ${day} with ${other}; publish at most one post per day` });
    else dayOwner.set(day, ref);
  }
  return problems;
}

export interface ScheduleManifest {
  builtAt: string;
  /** When the next scheduled post goes live; the deploy sync rebuilds the site once this has passed. */
  nextPublishAt: string | null;
}

/** Content of `dist/.schedule.json`. */
export function scheduleManifest(posts: readonly Dated[], builtAt: Date): ScheduleManifest {
  return { builtAt: builtAt.toISOString(), nextPublishAt: nextPublishAt(posts, builtAt)?.toISOString() ?? null };
}
