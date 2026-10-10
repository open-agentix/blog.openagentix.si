import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n/config';
import { postsForLocale, validatePosts, type PostMeta } from './lib/posts';
import { effectiveNow, publishedPosts, validateSchedule } from './lib/schedule';

export type Post = PostMeta & { entry: CollectionEntry<'posts'> };

// One instant per build, so every page agrees on which posts are live. The dev server asks again.
let buildInstant: Date | undefined;
function now(): Date {
  if (import.meta.env.DEV) return effectiveNow(process.env);
  return (buildInstant ??= effectiveNow(process.env));
}

/**
 * Every post that is live at build time, in every language. Scheduled posts (date in the future)
 * are validated with the rest but never returned, so no page, feed, sitemap entry, tag, related
 * list or language link can mention them. Fails the build when the translation graph or the
 * schedule of a translation pair is inconsistent.
 */
export async function allPosts(): Promise<Post[]> {
  const entries = await getCollection('posts');
  const posts = entries.map((entry): Post => {
    const slug = entry.id.split('/').pop() ?? entry.id;
    const { ref, lang, title, description, date, approval, updated, tags, author } = entry.data;
    if (!entry.id.startsWith(`${lang}/`)) {
      throw new Error(`Post ${entry.id}: front matter lang "${lang}" does not match its folder`);
    }
    return { slug, ref, lang, title, description, date, approval, updated, tags, author, body: entry.body ?? '', entry };
  });
  const problems = [...validatePosts(posts), ...validateSchedule(posts)];
  if (problems.length > 0) {
    throw new Error(`Inconsistent posts:\n${problems.map((p) => `- ${p.ref}: ${p.message}`).join('\n')}`);
  }
  return publishedPosts(posts, now());
}

export async function postsIn(locale: Locale): Promise<Post[]> {
  return postsForLocale(await allPosts(), locale);
}

export { render };
