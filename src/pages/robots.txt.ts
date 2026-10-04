import type { APIRoute } from 'astro';
import { SITE_URL } from '../project';

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL(SITE_URL)).origin;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
