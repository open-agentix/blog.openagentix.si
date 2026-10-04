import { defaultLocale, localeInfo, locales, type Locale } from '../i18n/config';
import { absolute, paths } from '../i18n/paths';
import { escapeXml } from './feed';
import { slugifyTag, tagCounts, type PostMeta } from './posts';

type SitemapPost = Pick<PostMeta, 'slug' | 'lang' | 'ref' | 'date' | 'updated' | 'tags'>;

export interface SitemapEntry {
  loc: string;
  lastmod?: string | undefined;
  /** hreflang to URL, including `x-default`. */
  alternates: { hreflang: string; href: string }[];
}

function alternatesFor(urlFor: (locale: Locale) => string | undefined, site: string | URL) {
  const out: { hreflang: string; href: string }[] = [];
  for (const locale of locales) {
    const path = urlFor(locale);
    if (path) out.push({ hreflang: localeInfo[locale].bcp47, href: absolute(path, site) });
  }
  const fallback = urlFor(defaultLocale);
  if (fallback) out.push({ hreflang: 'x-default', href: absolute(fallback, site) });
  return out;
}

/** All indexable pages with their language alternates. A post lists the languages it exists in. */
export function sitemapEntries(posts: readonly SitemapPost[], site: string | URL): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const newest = (list: readonly SitemapPost[]) => {
    const t = list.map((p) => (p.updated ?? p.date).getTime());
    return t.length ? new Date(Math.max(...t)).toISOString().slice(0, 10) : undefined;
  };

  for (const locale of locales) {
    entries.push({
      loc: absolute(paths.home(locale), site),
      lastmod: newest(posts.filter((p) => p.lang === locale)),
      alternates: alternatesFor((l) => paths.home(l), site),
    });
    entries.push({
      loc: absolute(paths.tags(locale), site),
      alternates: alternatesFor((l) => paths.tags(l), site),
    });
    for (const tag of tagCounts(posts.filter((p) => p.lang === locale))) {
      entries.push({
        loc: absolute(paths.tag(locale, tag.slug), site),
        alternates: alternatesFor(
          (l) => (posts.some((p) => p.lang === l && p.tags.some((t) => slugifyTag(t) === tag.slug)) ? paths.tag(l, tag.slug) : undefined),
          site,
        ),
      });
    }
  }
  for (const post of posts) {
    entries.push({
      loc: absolute(paths.post(post.lang, post.slug), site),
      lastmod: (post.updated ?? post.date).toISOString().slice(0, 10),
      alternates: alternatesFor((l) => {
        const sibling = posts.find((p) => p.ref === post.ref && p.lang === l);
        return sibling ? paths.post(l, sibling.slug) : undefined;
      }, site),
    });
  }
  return entries;
}

export function sitemapXml(entries: readonly SitemapEntry[]): string {
  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ];
  for (const e of entries) {
    lines.push('  <url>', `    <loc>${escapeXml(e.loc)}</loc>`);
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    for (const a of e.alternates) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escapeXml(a.href)}"/>`);
    }
    lines.push('  </url>');
  }
  lines.push('</urlset>', '');
  return lines.join('\n');
}
