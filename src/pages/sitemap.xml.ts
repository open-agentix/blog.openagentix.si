import type { APIRoute } from 'astro';
import { allPosts } from '../content-api';
import { sitemapEntries, sitemapXml } from '../lib/sitemap';
import { SITE_URL } from '../project';

export const GET: APIRoute = async ({ site }) => {
  const entries = sitemapEntries(await allPosts(), site ?? SITE_URL);
  return new Response(sitemapXml(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
