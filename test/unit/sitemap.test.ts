import { describe, expect, it } from 'vitest';
import { sitemapEntries, sitemapXml } from '../../src/lib/sitemap';

const site = 'https://blog.example.test';
const posts = [
  { slug: 'one', ref: 'one', lang: 'en' as const, date: new Date('2026-10-01T00:00:00Z'), tags: ['security'] },
  { slug: 'eins', ref: 'one', lang: 'de' as const, date: new Date('2026-10-01T00:00:00Z'), tags: ['security'] },
  { slug: 'solo', ref: 'solo', lang: 'en' as const, date: new Date('2026-10-02T00:00:00Z'), updated: new Date('2026-10-05T00:00:00Z'), tags: ['costs'] },
];

describe('sitemapEntries', () => {
  const entries = sitemapEntries(posts, site);
  const find = (loc: string) => entries.find((e) => e.loc === loc);

  it('contains home, tags and every post exactly once', () => {
    const locs = entries.map((e) => e.loc);
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs).toContain(`${site}/`);
    expect(locs).toContain(`${site}/de/`);
    expect(locs).toContain(`${site}/tags/`);
    expect(locs).toContain(`${site}/posts/solo/`);
    expect(locs).toContain(`${site}/de/posts/eins/`);
  });

  it('links translations of a post by ref, even with different slugs', () => {
    const en = find(`${site}/posts/one/`)!;
    expect(en.alternates).toEqual([
      { hreflang: 'en', href: `${site}/posts/one/` },
      { hreflang: 'de', href: `${site}/de/posts/eins/` },
      { hreflang: 'x-default', href: `${site}/posts/one/` },
    ]);
  });

  it('lists only the languages a post exists in and uses the update date', () => {
    const solo = find(`${site}/posts/solo/`)!;
    expect(solo.alternates.map((a) => a.hreflang)).toEqual(['en', 'x-default']);
    expect(solo.lastmod).toBe('2026-10-05');
  });

  it('offers a tag page in a language only when the tag exists there', () => {
    expect(find(`${site}/tags/security/`)!.alternates.map((a) => a.hreflang)).toEqual(['en', 'de', 'x-default']);
    expect(find(`${site}/tags/costs/`)!.alternates.map((a) => a.hreflang)).toEqual(['en', 'x-default']);
  });

  it('handles an empty blog', () => {
    expect(sitemapEntries([], site).every((e) => e.lastmod === undefined)).toBe(true);
  });
});

describe('sitemapXml', () => {
  it('serialises entries with xhtml alternates and escapes URLs', () => {
    const xml = sitemapXml([
      { loc: `${site}/?a=1&b=2`, lastmod: '2026-10-01', alternates: [{ hreflang: 'en', href: `${site}/` }] },
      { loc: `${site}/x/`, alternates: [] },
    ]);
    expect(xml).toContain('<loc>https://blog.example.test/?a=1&amp;b=2</loc>');
    expect(xml).toContain('<lastmod>2026-10-01</lastmod>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://blog.example.test/"/>');
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });
});
