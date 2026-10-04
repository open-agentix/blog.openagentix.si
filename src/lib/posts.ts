import { defaultLocale, localeInfo, locales, type Locale } from '../i18n/config';

/** Everything the site needs to know about a post, independent of the content collection. */
export interface PostMeta {
  /** File name without extension, used in the URL. */
  slug: string;
  /** Stable id shared by all translations of one post. */
  ref: string;
  lang: Locale;
  title: string;
  description: string;
  date: Date;
  updated?: Date | undefined;
  tags: string[];
  author: string;
  /** Markdown source, used for the reading time. */
  body: string;
}

/** Newest first; ties are broken by slug so the order is stable. */
export function sortPosts<T extends Pick<PostMeta, 'date' | 'slug'>>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.date.getTime() - a.date.getTime() || a.slug.localeCompare(b.slug));
}

/** Posts of one language, newest first. Each post appears once because translations are separate files. */
export function postsForLocale<T extends Pick<PostMeta, 'date' | 'slug' | 'lang'>>(
  posts: readonly T[],
  locale: Locale,
): T[] {
  return sortPosts(posts.filter((p) => p.lang === locale));
}

/** The other-language versions of a post (same `ref`, different `lang`). */
export function translationsOf<T extends Pick<PostMeta, 'ref' | 'lang'>>(post: T, posts: readonly T[]): T[] {
  return posts.filter((p) => p.ref === post.ref && p.lang !== post.lang);
}

/** The version of a post in `locale`, if there is one. */
export function inLocale<T extends Pick<PostMeta, 'ref' | 'lang'>>(
  post: T,
  posts: readonly T[],
  locale: Locale,
): T | undefined {
  return posts.find((p) => p.ref === post.ref && p.lang === locale);
}

/** URL-safe tag: lower case, ASCII letters and digits, single dashes. */
export function slugifyTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TagCount {
  /** URL slug of the tag. */
  slug: string;
  /** Label as written in the first post that uses it. */
  label: string;
  count: number;
}

/** Tags used by the posts of one language, most used first, then alphabetical. */
export function tagCounts(posts: readonly Pick<PostMeta, 'tags'>[]): TagCount[] {
  const map = new Map<string, TagCount>();
  for (const post of posts) {
    for (const label of new Set(post.tags)) {
      const slug = slugifyTag(label);
      if (!slug) continue;
      const entry = map.get(slug);
      if (entry) entry.count += 1;
      else map.set(slug, { slug, label, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

export function postsWithTag<T extends Pick<PostMeta, 'tags'>>(posts: readonly T[], tagSlug: string): T[] {
  return posts.filter((p) => p.tags.some((t) => slugifyTag(t) === tagSlug));
}

const FENCE = /^(```|~~~)[\s\S]*?^\1\s*$/gm;

/** Words in the prose of a Markdown document (code blocks, inline SVG, HTML tags and front matter markers excluded). */
export function wordCount(markdown: string): number {
  const prose = markdown
    .replace(FENCE, ' ')
    // Inline diagrams are looked at, not read; other HTML tags carry no prose.
    .replace(/<svg\b[\s\S]*?<\/svg>/g, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[#>*_|~-]+/g, ' ');
  const words = prose.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu);
  return words ? words.length : 0;
}

/** Lines inside fenced code blocks; they are read more slowly than prose. */
export function codeLines(markdown: string): number {
  let lines = 0;
  for (const block of markdown.matchAll(FENCE)) lines += Math.max(0, block[0].split('\n').length - 2);
  return lines;
}

/** Whole minutes, at least one. Prose at the locale's reading speed, code at 20 lines per minute. */
export function readingTime(markdown: string, locale: Locale = defaultLocale): number {
  const minutes = wordCount(markdown) / localeInfo[locale].wordsPerMinute + codeLines(markdown) / 20;
  return Math.max(1, Math.ceil(minutes));
}

export interface ContentProblem {
  ref: string;
  message: string;
}

/**
 * Consistency of the translation graph: one file per (ref, lang), the slug is unique per language,
 * and every post exists in every locale (otherwise the language switch would lead nowhere).
 */
export function validatePosts(posts: readonly Pick<PostMeta, 'ref' | 'lang' | 'slug'>[]): ContentProblem[] {
  const problems: ContentProblem[] = [];
  const seen = new Map<string, string>();
  const slugs = new Map<string, string>();
  for (const p of posts) {
    const key = `${p.ref}/${p.lang}`;
    if (seen.has(key)) problems.push({ ref: p.ref, message: `duplicate ${p.lang} version (${seen.get(key)}, ${p.slug})` });
    seen.set(key, p.slug);
    const slugKey = `${p.lang}/${p.slug}`;
    if (slugs.has(slugKey)) problems.push({ ref: p.ref, message: `duplicate slug ${p.slug} in ${p.lang}` });
    slugs.set(slugKey, p.ref);
  }
  for (const ref of new Set(posts.map((p) => p.ref))) {
    for (const locale of locales) {
      if (!seen.has(`${ref}/${locale}`)) problems.push({ ref, message: `missing ${locale} translation` });
    }
  }
  return problems;
}

/** Formats a date for display, e.g. `4 October 2026` or `4. Oktober 2026`. */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(localeInfo[locale].dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
