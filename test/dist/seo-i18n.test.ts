import { describe, expect, it } from 'vitest';
import { assertBuilt, distFiles, read } from './helpers';

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const links = (html: string, rel: string) =>
  [...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]).filter((t) => attr(t, 'rel') === rel);

describe('pages', () => {
  assertBuilt();
  const files = distFiles();
  const pages = files.filter((f) => f.endsWith('.html') && f !== '404.html');

  it('has a CNAME file for the custom domain and a 404 page', () => {
    expect(files).toContain('CNAME');
    expect(read('CNAME').trim()).toBe('blog.openagentix.si');
    expect(files).toContain('404.html');
  });

  it.each(pages)('%s has language, canonical, description and Open Graph data', (file) => {
    const html = read(file);
    const lang = file.startsWith('de/') ? 'de' : 'en';
    expect(html).toMatch(new RegExp(`<html lang="${lang}"`));
    expect(links(html, 'canonical')).toHaveLength(1);
    expect(html).toMatch(/<meta name="description" content="[^"]{30,}"/);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image" content="https://blog.openagentix.si/og.png"');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it('declares reciprocal hreflang alternates that exist', () => {
    const fileFor = (href: string) => `${new URL(href).pathname.replace(/^\//, '')}index.html`;
    for (const file of pages) {
      const html = read(file);
      const alts = links(html, 'alternate').filter((t) => attr(t, 'hreflang') && attr(t, 'type') === undefined);
      if (alts.length === 0) continue;
      for (const a of alts) {
        const target = fileFor(attr(a, 'href')!);
        expect(files, `${file} -> ${target}`).toContain(target);
        const back = links(read(target), 'alternate').map((t) => attr(t, 'href'));
        expect(back, `${target} links back to ${file}`).toContain(attr(links(html, 'canonical')[0]!, 'href'));
      }
    }
  });

  it('marks every post as an article with structured data', () => {
    for (const file of pages.filter((f) => /posts\/[^/]+\/index\.html$/.test(f))) {
      const html = read(file);
      expect(html).toContain('property="og:type" content="article"');
      expect(html).toContain('"@type":"BlogPosting"');
      expect(html).toContain('property="article:published_time"');
    }
  });

  it('highlights code at build time without client-side code', () => {
    const withCode = pages.filter((f) => read(f).includes('astro-code'));
    expect(withCode.length).toBeGreaterThan(0);
    for (const f of withCode) expect(read(f)).toContain('--shiki-dark');
  });
});

describe('language versions of posts', () => {
  assertBuilt();
  const files = distFiles();
  const posts = (prefix: string) =>
    files.filter((f) => new RegExp(`^${prefix}posts/[^/]+/index\\.html$`).test(f)).map((f) => f.replace(/index\.html$/, ''));

  it('has the same posts in both languages', () => {
    const en = posts('').filter((p) => !p.startsWith('de/'));
    const de = posts('de/').map((p) => p.replace(/^de\//, ''));
    expect(en.length).toBeGreaterThan(0);
    expect(de.sort()).toEqual(en.sort());
  });

  it('lists each post once on the home page of each language', () => {
    for (const [file, prefix] of [['index.html', '/posts/'], ['de/index.html', '/de/posts/']] as const) {
      const hrefs = [...read(file).matchAll(/<h2><a href="([^"]+)"/g)].map((m) => m[1]!);
      expect(hrefs.length).toBeGreaterThan(0);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      for (const h of hrefs) expect(h.startsWith(prefix)).toBe(true);
    }
  });
});

describe('feeds and sitemap', () => {
  assertBuilt();
  const ids = (xml: string, tag: 'entry' | 'item') =>
    [...xml.matchAll(new RegExp(`<${tag}>[\\s\\S]*?<(?:id|guid)[^>]*>([^<]+)<`, 'g'))].map((m) => m[1]!);

  it.each([
    ['feed.xml', 'entry', '/posts/'],
    ['de/feed.xml', 'entry', '/de/posts/'],
    ['rss.xml', 'item', '/posts/'],
    ['de/rss.xml', 'item', '/de/posts/'],
  ] as const)('%s lists each post of its language exactly once', (file, tag, prefix) => {
    const xml = read(file);
    const list = ids(xml, tag);
    expect(list.length).toBeGreaterThan(0);
    expect(new Set(list).size).toBe(list.length);
    for (const url of list) expect(new URL(url).pathname.startsWith(prefix)).toBe(true);
    if (prefix === '/posts/') for (const url of list) expect(url).not.toContain('/de/');
  });

  it('feeds contain as many entries as the language has posts', () => {
    const count = (f: string) => distFiles().filter((x) => x.startsWith(f) && x.endsWith('/index.html') && x.includes('posts/')).length;
    expect(ids(read('feed.xml'), 'entry').length).toBe(distFiles().filter((x) => /^posts\/[^/]+\/index\.html$/.test(x)).length);
    expect(ids(read('de/feed.xml'), 'entry').length).toBe(count('de/'));
  });

  it('advertises the feeds in every page head', () => {
    for (const file of ['index.html', 'de/index.html']) {
      const html = read(file);
      expect(html).toContain('href="/feed.xml"');
      expect(html).toContain('href="/de/feed.xml"');
    }
  });

  it('sitemap lists every page once with a canonical host', () => {
    const xml = read('sitemap.xml');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) expect(loc.startsWith('https://blog.openagentix.si/')).toBe(true);
    expect(read('robots.txt')).toContain('Sitemap: https://blog.openagentix.si/sitemap.xml');
  });
});
