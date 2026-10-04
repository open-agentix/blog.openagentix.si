import { describe, expect, it } from 'vitest';
import { atomFeed, escapeXml, feedPosts, rssFeed, stripInvalidXml } from '../../src/lib/feed';
import type { PostMeta } from '../../src/lib/posts';

const post = (over: Partial<PostMeta>): PostMeta => ({
  slug: 'one',
  ref: 'one',
  lang: 'en',
  title: 'Tom & "Jerry" <b>',
  description: 'About <things> & more',
  date: new Date('2026-10-01T08:00:00Z'),
  tags: ['security', 'a&b'],
  author: 'agentix-zero',
  body: '',
  ...over,
});

const posts = [
  post({}),
  post({ slug: 'one', lang: 'de', title: 'Deutsch' }),
  post({ slug: 'two', ref: 'two', date: new Date('2026-10-03T08:00:00Z'), updated: new Date('2026-10-04T08:00:00Z') }),
  post({ slug: 'two', ref: 'two', lang: 'de', title: 'Zwei' }),
];
const base = { site: 'https://blog.example.test', title: 'Blog', description: 'Desc & more' };

describe('xml helpers', () => {
  it('escapes markup characters', () => {
    expect(escapeXml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;');
  });

  it('drops characters that are illegal in XML 1.0', () => {
    expect(stripInvalidXml('a\u0000b\u000Bc\td\n')).toBe('abc\td\n');
  });
});

describe('feedPosts', () => {
  it('keeps one entry per post and only the feed language', () => {
    const list = feedPosts([...posts, post({ slug: 'dup', ref: 'one' })], 'en');
    expect(list.map((p) => p.ref).sort()).toEqual(['one', 'two']);
    expect(feedPosts(posts, 'de').every((p) => p.lang === 'de')).toBe(true);
  });
});

describe('atomFeed', () => {
  const xml = atomFeed({ ...base, locale: 'en', posts });

  it('is a well-formed Atom feed for the language with absolute URLs', () => {
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">');
    expect(xml).toContain('<link rel="self" type="application/atom+xml" href="https://blog.example.test/feed.xml"/>');
    expect(xml).toContain('<id>https://blog.example.test/posts/two/</id>');
    expect(xml).not.toContain('/de/posts/');
  });

  it('lists every post exactly once', () => {
    expect(xml.match(/<entry>/g)).toHaveLength(2);
    expect(xml.match(/<id>https:\/\/blog\.example\.test\/posts\/one\/<\/id>/g)).toHaveLength(1);
  });

  it('escapes content and uses the update time of the newest post', () => {
    expect(xml).toContain('<title>Tom &amp; &quot;Jerry&quot; &lt;b&gt;</title>');
    expect(xml).toContain('<category term="a&amp;b"/>');
    expect(xml).toContain('<updated>2026-10-04T08:00:00.000Z</updated>');
  });

  it('builds the German feed under /de/ and honours a fixed update time', () => {
    const de = atomFeed({ ...base, locale: 'de', posts, updated: new Date('2027-01-01T00:00:00Z') });
    expect(de).toContain('xml:lang="de"');
    expect(de).toContain('https://blog.example.test/de/feed.xml');
    expect(de).toContain('<id>https://blog.example.test/de/posts/two/</id>');
    expect(de).toContain('<updated>2027-01-01T00:00:00.000Z</updated>');
  });

  it('handles a feed without posts', () => {
    const empty = atomFeed({ ...base, locale: 'en', posts: [] });
    expect(empty).toContain('<updated>1970-01-01T00:00:00.000Z</updated>');
    expect(empty).not.toContain('<entry>');
  });
});

describe('rssFeed', () => {
  const xml = rssFeed({ ...base, locale: 'en', posts });

  it('is an RSS 2.0 feed with permalinks as guids', () => {
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<guid isPermaLink="true">https://blog.example.test/posts/one/</guid>');
    expect(xml).toContain('<atom:link href="https://blog.example.test/rss.xml" rel="self" type="application/rss+xml"/>');
    expect(xml.match(/<item>/g)).toHaveLength(2);
    expect(xml).toContain('<language>en</language>');
  });

  it('uses RFC 822 dates and escapes text', () => {
    expect(xml).toContain('<pubDate>Thu, 01 Oct 2026 08:00:00 GMT</pubDate>');
    expect(xml).toContain('<description>About &lt;things&gt; &amp; more</description>');
  });

  it('builds the German feed', () => {
    const de = rssFeed({ ...base, locale: 'de', posts });
    expect(de).toContain('<language>de</language>');
    expect(de).toContain('https://blog.example.test/de/rss.xml');
    expect(de.match(/<item>/g)).toHaveLength(2);
  });
});
