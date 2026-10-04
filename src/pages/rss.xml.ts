import type { APIRoute } from 'astro';
import { allPosts } from '../content-api';
import { getDictionary } from '../i18n/ui';
import { rssFeed } from '../lib/feed';
import { SITE_URL } from '../project';

export const GET: APIRoute = async ({ site }) => {
  const t = getDictionary('en');
  const body = rssFeed({
    site: site ?? SITE_URL,
    locale: 'en',
    title: t.blogName,
    description: t.homeDescription,
    posts: await allPosts(),
  });
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
