import { localeInfo, type Locale } from '../i18n/config';
import { absolute, paths } from '../i18n/paths';
import type { PostMeta } from './posts';
import { postsForLocale } from './posts';

export interface FeedOptions {
  site: string | URL;
  locale: Locale;
  title: string;
  description: string;
  posts: readonly Pick<PostMeta, 'slug' | 'lang' | 'title' | 'description' | 'date' | 'updated' | 'tags' | 'author' | 'ref'>[];
  /** Fixed value for the feed-level update time (tests); defaults to the newest post. */
  updated?: Date;
}

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c);
}

/** Characters XML 1.0 forbids (control characters except tab, newline, carriage return) are removed. */
export function stripInvalidXml(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '');
}

const xml = (value: string) => escapeXml(stripInvalidXml(value));

/** Only posts of the feed's language, each exactly once (a post is identified by its ref). */
export function feedPosts<T extends Pick<PostMeta, 'slug' | 'lang' | 'date' | 'ref'>>(
  posts: readonly T[],
  locale: Locale,
): T[] {
  const seen = new Set<string>();
  return postsForLocale(posts, locale).filter((p) => {
    if (seen.has(p.ref)) return false;
    seen.add(p.ref);
    return true;
  });
}

function latest(options: FeedOptions, entries: readonly { date: Date; updated?: Date | undefined }[]): Date {
  if (options.updated) return options.updated;
  const times = entries.map((e) => (e.updated ?? e.date).getTime());
  return new Date(times.length ? Math.max(...times) : 0);
}

/** Atom 1.0 feed for one language. */
export function atomFeed(options: FeedOptions): string {
  const { site, locale } = options;
  const entries = feedPosts(options.posts, locale);
  const self = absolute(paths.atom(locale), site);
  const home = absolute(paths.home(locale), site);
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${localeInfo[locale].bcp47}">`,
    `  <title>${xml(options.title)}</title>`,
    `  <subtitle>${xml(options.description)}</subtitle>`,
    `  <id>${xml(home)}</id>`,
    `  <link rel="self" type="application/atom+xml" href="${xml(self)}"/>`,
    `  <link rel="alternate" type="text/html" href="${xml(home)}"/>`,
    `  <updated>${latest(options, entries).toISOString()}</updated>`,
    '  <generator>openagentix blog</generator>',
  ];
  for (const post of entries) {
    const url = absolute(paths.post(locale, post.slug), site);
    lines.push(
      '  <entry>',
      `    <title>${xml(post.title)}</title>`,
      `    <id>${xml(url)}</id>`,
      `    <link rel="alternate" type="text/html" href="${xml(url)}" hreflang="${localeInfo[locale].bcp47}"/>`,
      `    <published>${post.date.toISOString()}</published>`,
      `    <updated>${(post.updated ?? post.date).toISOString()}</updated>`,
      `    <author><name>${xml(post.author)}</name></author>`,
      ...post.tags.map((t) => `    <category term="${xml(t)}"/>`),
      `    <summary>${xml(post.description)}</summary>`,
      '  </entry>',
    );
  }
  lines.push('</feed>', '');
  return lines.join('\n');
}

/** RSS 2.0 feed for one language. */
export function rssFeed(options: FeedOptions): string {
  const { site, locale } = options;
  const entries = feedPosts(options.posts, locale);
  const self = absolute(paths.rss(locale), site);
  const home = absolute(paths.home(locale), site);
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${xml(options.title)}</title>`,
    `    <link>${xml(home)}</link>`,
    `    <description>${xml(options.description)}</description>`,
    `    <language>${localeInfo[locale].bcp47}</language>`,
    `    <lastBuildDate>${latest(options, entries).toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml"/>`,
  ];
  for (const post of entries) {
    const url = absolute(paths.post(locale, post.slug), site);
    lines.push(
      '    <item>',
      `      <title>${xml(post.title)}</title>`,
      `      <link>${xml(url)}</link>`,
      `      <guid isPermaLink="true">${xml(url)}</guid>`,
      `      <pubDate>${post.date.toUTCString()}</pubDate>`,
      `      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${xml(post.author)}</dc:creator>`,
      ...post.tags.map((t) => `      <category>${xml(t)}</category>`),
      `      <description>${xml(post.description)}</description>`,
      '    </item>',
    );
  }
  lines.push('  </channel>', '</rss>', '');
  return lines.join('\n');
}
