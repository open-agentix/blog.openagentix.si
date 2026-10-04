import { describe, expect, it } from 'vitest';
import {
  codeLines,
  formatDate,
  inLocale,
  postsForLocale,
  postsWithTag,
  readingTime,
  slugifyTag,
  sortPosts,
  tagCounts,
  translationsOf,
  validatePosts,
  wordCount,
  type PostMeta,
} from '../../src/lib/posts';

const post = (over: Partial<PostMeta> = {}): PostMeta => ({
  slug: 'a',
  ref: 'a',
  lang: 'en',
  title: 'A',
  description: 'd',
  date: new Date('2026-10-01T00:00:00Z'),
  tags: ['security'],
  author: 'agentix-zero',
  body: 'one two three',
  ...over,
});

describe('sorting and filtering', () => {
  it('sorts newest first and breaks ties by slug', () => {
    const list = [
      post({ slug: 'b', date: new Date('2026-10-02T00:00:00Z') }),
      post({ slug: 'c', date: new Date('2026-10-03T00:00:00Z') }),
      post({ slug: 'a', date: new Date('2026-10-02T00:00:00Z') }),
    ];
    expect(sortPosts(list).map((p) => p.slug)).toEqual(['c', 'a', 'b']);
    expect(list.map((p) => p.slug)).toEqual(['b', 'c', 'a']); // input is not mutated
  });

  it('lists each language separately so a post appears once per language', () => {
    const list = [post({ slug: 'a' }), post({ slug: 'a-de', ref: 'a', lang: 'de' })];
    expect(postsForLocale(list, 'en')).toHaveLength(1);
    expect(postsForLocale(list, 'de').map((p) => p.slug)).toEqual(['a-de']);
  });

  it('links translations through ref and lang', () => {
    const en = post();
    const de = post({ slug: 'a-de', lang: 'de' });
    const other = post({ slug: 'x', ref: 'x' });
    expect(translationsOf(en, [en, de, other])).toEqual([de]);
    expect(inLocale(en, [en, de], 'de')).toBe(de);
    expect(inLocale(other, [en, de, other], 'de')).toBeUndefined();
  });
});

describe('tags', () => {
  it('slugifies tags to URL-safe ASCII', () => {
    expect(slugifyTag(' Audit Trail ')).toBe('audit-trail');
    expect(slugifyTag('Größe & Kosten')).toBe('groesse-kosten');
    expect(slugifyTag('Café')).toBe('cafe');
    expect(slugifyTag('---')).toBe('');
  });

  it('counts tags once per post, most used first', () => {
    const list = [
      post({ tags: ['security', 'audit', 'security'] }),
      post({ slug: 'b', tags: ['Security'] }),
      post({ slug: 'c', tags: ['zeta', '!!'] }),
    ];
    const counts = tagCounts(list);
    expect(counts[0]).toEqual({ slug: 'security', label: 'security', count: 2 });
    expect(counts.map((c) => c.slug)).toEqual(['security', 'audit', 'zeta']);
  });

  it('filters posts by tag slug', () => {
    const list = [post({ tags: ['Audit Trail'] }), post({ slug: 'b', tags: ['costs'] })];
    expect(postsWithTag(list, 'audit-trail')).toHaveLength(1);
    expect(postsWithTag(list, 'nothing')).toHaveLength(0);
  });
});

describe('reading time', () => {
  it('counts prose words and ignores fenced code, links targets and markup', () => {
    const md = 'Hello [world](https://example.com/very/long/url) and `code`.\n\n```js\nconst ignored = 1;\n```\n\n## Heading words';
    expect(wordCount(md)).toBe(6);
    expect(wordCount('')).toBe(0);
  });

  it('counts the lines of code blocks', () => {
    expect(codeLines('```\na\nb\n```\ntext\n~~~\nc\n~~~')).toBe(3);
    expect(codeLines('no code')).toBe(0);
  });

  it('rounds up, never below one minute, and reads German a bit slower', () => {
    expect(readingTime('short')).toBe(1);
    const words = Array.from({ length: 221 }, () => 'word').join(' ');
    expect(readingTime(words, 'en')).toBe(2);
    const some = Array.from({ length: 200 }, () => 'word').join(' ');
    expect(readingTime(some, 'en')).toBe(1);
    expect(readingTime(some, 'de')).toBe(2);
  });

  it('adds time for code', () => {
    const code = '```\n' + Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n') + '\n```';
    expect(readingTime(code)).toBe(3);
  });
});

describe('validatePosts', () => {
  it('accepts a complete translation graph', () => {
    expect(
      validatePosts([
        { ref: 'a', lang: 'en', slug: 'a' },
        { ref: 'a', lang: 'de', slug: 'a' },
      ]),
    ).toEqual([]);
  });

  it('reports missing translations, duplicate versions and duplicate slugs', () => {
    const problems = validatePosts([
      { ref: 'a', lang: 'en', slug: 'a' },
      { ref: 'a', lang: 'en', slug: 'a-copy' },
      { ref: 'b', lang: 'en', slug: 'a' },
      { ref: 'b', lang: 'de', slug: 'b' },
    ]);
    const messages = problems.map((p) => `${p.ref}: ${p.message}`);
    expect(messages).toContain('a: duplicate en version (a, a-copy)');
    expect(messages).toContain('b: duplicate slug a in en');
    expect(messages).toContain('a: missing de translation');
  });
});

describe('formatDate', () => {
  it('formats in the locale of the reader, independent of the server time zone', () => {
    const d = new Date('2026-10-04T23:30:00Z');
    expect(formatDate(d, 'en')).toBe('4 October 2026');
    expect(formatDate(d, 'de')).toBe('4. Oktober 2026');
  });
});
