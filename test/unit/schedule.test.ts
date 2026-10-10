import { describe, expect, it } from 'vitest';
import {
  effectiveNow,
  isPublished,
  nextPublishAt,
  publishedPosts,
  scheduleManifest,
  validateSchedule,
} from '../../src/lib/schedule';
import { readPostDates } from '../../scripts/post-dates.mjs';
import { sitemapEntries } from '../../src/lib/sitemap';
import { inLocale, postsForLocale, tagCounts, type PostMeta } from '../../src/lib/posts';
import type { Locale } from '../../src/i18n/config';

const withDates = (raw: { file: string; ref: string; lang: string; date: string }[]) =>
  raw.map((p) => ({ ...p, lang: p.lang as Locale, date: new Date(p.date) }));

const at = (iso: string) => new Date(iso);
const post = (over: Partial<PostMeta> = {}): PostMeta => ({
  slug: 'a',
  ref: 'a',
  lang: 'en',
  title: 'A',
  description: 'd',
  date: at('2026-10-01T00:00:00Z'),
  tags: ['security'],
  author: 'agentix-zero',
  body: '',
  ...over,
});

describe('publication gate with a fake now', () => {
  const live = post({ slug: 'live', ref: 'live', date: at('2026-10-06T05:00:00Z') });
  const soon = post({ slug: 'soon', ref: 'soon', date: at('2026-10-13T05:00:00Z'), tags: ['secret-topic'] });
  const later = post({ slug: 'later', ref: 'later', date: at('2026-10-15T05:00:00Z') });

  it('keeps posts with a future date out', () => {
    expect(publishedPosts([live, soon, later], at('2026-10-10T00:00:00Z'))).toEqual([live]);
  });

  it('publishes a post exactly at its date and not one millisecond earlier', () => {
    expect(isPublished(soon, at('2026-10-13T04:59:59.999Z'))).toBe(false);
    expect(isPublished(soon, at('2026-10-13T05:00:00.000Z'))).toBe(true);
  });

  it('reports the earliest future date, or null', () => {
    expect(nextPublishAt([live, soon, later], at('2026-10-10T00:00:00Z'))).toEqual(soon.date);
    expect(nextPublishAt([live, soon, later], at('2026-10-14T00:00:00Z'))).toEqual(later.date);
    expect(nextPublishAt([live, soon, later], at('2026-10-16T00:00:00Z'))).toBeNull();
  });

  it('builds the manifest for the deploy sync', () => {
    const builtAt = at('2026-10-10T00:00:00Z');
    expect(scheduleManifest([live, soon, later], builtAt)).toEqual({
      builtAt: '2026-10-10T00:00:00.000Z',
      nextPublishAt: '2026-10-13T05:00:00.000Z',
    });
    expect(scheduleManifest([live], builtAt).nextPublishAt).toBeNull();
  });

  it('leaves no trace of a scheduled post in lists, tags, sitemap and translation links', () => {
    const pair = [
      post({ slug: 'p-en', ref: 'p', lang: 'en', date: soon.date, tags: ['secret-topic'] }),
      post({ slug: 'p-de', ref: 'p', lang: 'de', date: soon.date, tags: ['secret-topic'] }),
    ];
    const all = [live, ...pair];
    const visible = publishedPosts(all, at('2026-10-10T00:00:00Z'));
    expect(postsForLocale(visible, 'en').map((p) => p.slug)).toEqual(['live']);
    expect(tagCounts(visible).map((t) => t.slug)).not.toContain('secret-topic');
    expect(inLocale(visible[0]!, visible, 'de')).toBeUndefined();
    const xml = JSON.stringify(sitemapEntries(visible, 'https://blog.openagentix.si'));
    expect(xml).not.toContain('p-en');
    expect(xml).not.toContain('secret-topic');
    // Once the date has passed the same input yields both versions.
    const later = publishedPosts(all, at('2026-10-13T05:00:00Z'));
    expect(postsForLocale(later, 'en').map((p) => p.slug)).toContain('p-en');
    expect(postsForLocale(later, 'de').map((p) => p.slug)).toContain('p-de');
  });
});

describe('owner approval', () => {
  const scheduled = post({ slug: 's', ref: 's', date: at('2026-10-13T05:00:00Z') });
  const before = at('2026-10-12T00:00:00Z');
  const after = at('2026-10-13T05:00:00Z');

  it('releases an approved post before its date and keeps its date', () => {
    const approved = { ...scheduled, approval: 'approved' as const };
    expect(isPublished(approved, before)).toBe(true);
    expect(approved.date).toEqual(scheduled.date);
  });

  it('never publishes a vetoed post, also after its date', () => {
    const vetoed = { ...scheduled, approval: 'vetoed' as const };
    expect(isPublished(vetoed, before)).toBe(false);
    expect(isPublished(vetoed, after)).toBe(false);
    expect(isPublished({ ...scheduled, approval: 'none' as const }, after)).toBe(true);
  });

  it('counts only undecided future posts for the rebuild instant', () => {
    const approved = { ...scheduled, approval: 'approved' as const };
    const vetoed = { ...scheduled, date: at('2026-10-15T05:00:00Z'), approval: 'vetoed' as const };
    const plain = { ...scheduled, date: at('2026-10-20T05:00:00Z') };
    expect(nextPublishAt([approved, vetoed, plain], before)).toEqual(plain.date);
    expect(nextPublishAt([approved, vetoed], before)).toBeNull();
  });

  it('requires the same approval in both languages', () => {
    const problems = validateSchedule([
      post({ ref: 'x', lang: 'en', approval: 'approved' }),
      post({ ref: 'x', lang: 'de', approval: 'none' }),
    ]);
    expect(problems.map((p) => p.message).join()).toContain('different approval');
  });
});

describe('one post per day', () => {
  it('refuses two different posts on one Berlin calendar day', () => {
    const problems = validateSchedule([
      post({ ref: 'a', date: at('2026-10-13T05:00:00Z') }),
      post({ ref: 'b', date: at('2026-10-13T15:00:00Z') }),
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('at most one post per day');
  });

  it('judges the day in Berlin time, not UTC', () => {
    // 22:30 UTC on the 12th is 00:30 on the 13th in Berlin.
    expect(validateSchedule([
      post({ ref: 'a', date: at('2026-10-12T22:30:00Z') }),
      post({ ref: 'b', date: at('2026-10-12T05:00:00Z') }),
    ])).toEqual([]);
  });
});

describe('validateSchedule', () => {
  it('accepts pairs with the same instant, also in different notations', () => {
    const problems = validateSchedule([
      post({ ref: 'x', lang: 'en', date: at('2026-10-13T07:00:00+02:00') }),
      post({ ref: 'x', lang: 'de', date: at('2026-10-13T05:00:00Z') }),
    ]);
    expect(problems).toEqual([]);
  });

  it('fails when only one language of a pair would be published', () => {
    const problems = validateSchedule([
      post({ ref: 'x', lang: 'en', date: at('2026-10-13T05:00:00Z') }),
      post({ ref: 'x', lang: 'de', date: at('2026-10-15T05:00:00Z') }),
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ ref: 'x', message: expect.stringContaining('different dates') });
  });
});

describe('effectiveNow', () => {
  const clock = () => at('2026-10-10T00:00:00Z');

  it('is the clock by default', () => {
    expect(effectiveNow({}, clock)).toEqual(clock());
    expect(effectiveNow({ PREVIEW_FUTURE: '0' }, clock)).toEqual(clock());
    expect(effectiveNow({ PREVIEW_FUTURE: 'true' }, clock)).toEqual(clock());
  });

  it('is far in the future only with PREVIEW_FUTURE=1', () => {
    expect(isPublished(post({ date: at('2099-01-01T00:00:00Z') }), effectiveNow({ PREVIEW_FUTURE: '1' }, clock))).toBe(true);
  });
});

describe('scheduled fixture pair (test/fixtures, not built)', () => {
  const dates = withDates(readPostDates('test/fixtures/scheduled-pair'));

  it('has both languages on the same instant', () => {
    expect(dates.map((d) => d.lang).sort()).toEqual(['de', 'en']);
    expect(validateSchedule(dates)).toEqual([]);
  });

  it('is invisible before and visible after its date', () => {
    expect(publishedPosts(dates, at('2026-10-13T04:59:59Z'))).toHaveLength(0);
    expect(publishedPosts(dates, at('2026-10-13T05:00:00Z'))).toHaveLength(2);
  });
});

describe('real posts', () => {
  const raw = readPostDates('src/content/posts');

  it('use an ISO datetime with offset in the front matter', () => {
    for (const p of raw) {
      expect(p.date, p.file).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
    }
  });

  it('use a known approval value', () => {
    for (const p of raw) expect(['none', 'approved', 'vetoed'], p.file).toContain(p.approval);
  });

  it('publish at most one pair per day', () => {
    expect(validateSchedule(withDates(raw)).map((p) => p.message).filter((m) => m.includes('per day'))).toEqual([]);
  });

  it('share one publication instant per ref across languages', () => {
    const problems = validateSchedule(withDates(raw));
    expect(problems).toEqual([]);
  });
});
