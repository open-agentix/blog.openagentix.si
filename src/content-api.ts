import { getCollection, render, type CollectionEntry } from 'astro:content';
import type { Locale } from './i18n/config';
import { postsForLocale, validatePosts, type PostMeta } from './lib/posts';

export type Post = PostMeta & { entry: CollectionEntry<'posts'> };

/** Every post of every language. Fails the build when the translation graph is inconsistent. */
export async function allPosts(): Promise<Post[]> {
  const entries = await getCollection('posts');
  const posts = entries.map((entry): Post => {
    const slug = entry.id.split('/').pop() ?? entry.id;
    const { ref, lang, title, description, date, updated, tags, author } = entry.data;
    if (!entry.id.startsWith(`${lang}/`)) {
      throw new Error(`Post ${entry.id}: front matter lang "${lang}" does not match its folder`);
    }
    return { slug, ref, lang, title, description, date, updated, tags, author, body: entry.body ?? '', entry };
  });
  const problems = validatePosts(posts);
  if (problems.length > 0) {
    throw new Error(`Inconsistent posts:\n${problems.map((p) => `- ${p.ref}: ${p.message}`).join('\n')}`);
  }
  return posts;
}

export async function postsIn(locale: Locale): Promise<Post[]> {
  return postsForLocale(await allPosts(), locale);
}

export { render };
