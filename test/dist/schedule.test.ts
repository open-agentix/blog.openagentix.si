import { describe, expect, it } from 'vitest';
import { readPostDates } from '../../scripts/post-dates.mjs';
import { assertBuilt, distFiles, read } from './helpers';

// Uses the build time recorded in dist/.schedule.json as "now", so the checks hold for any build time.
describe('scheduled publishing in the build', () => {
  assertBuilt();
  const files = distFiles();
  const manifest = JSON.parse(read('.schedule.json')) as { builtAt: string; nextPublishAt: string | null };
  const builtAt = Date.parse(manifest.builtAt);
  const previewBuild = process.env['PREVIEW_FUTURE'] === '1';
  const posts = readPostDates('src/content/posts');
  const dated = posts.map((p) => ({ ...p, time: Date.parse(p.date) }));
  const isLive = (p: (typeof dated)[number]) => p.approval !== 'vetoed' && (p.approval === 'approved' || p.time <= builtAt);
  const slugOf = (file: string) => file.split('/').pop()!.replace(/\.md$/, '');
  const urlOf = (p: (typeof dated)[number]) => (p.lang === 'de' ? `/de/posts/${slugOf(p.file)}/` : `/posts/${slugOf(p.file)}/`);

  it('writes a manifest with builtAt and the earliest future publish instant', () => {
    expect(Number.isNaN(builtAt)).toBe(false);
    const future = dated.filter((p) => p.approval === 'none').map((p) => p.time).filter((t) => t > builtAt);
    const expected = future.length > 0 ? new Date(Math.min(...future)).toISOString() : null;
    expect(manifest.nextPublishAt).toBe(expected);
  });

  it('generates a page for every published post and for no scheduled post', () => {
    for (const p of dated) {
      const page = `${urlOf(p).slice(1)}index.html`;
      if ((previewBuild && p.approval !== 'vetoed') || isLive(p)) expect(files, p.file).toContain(page);
      else expect(files, p.file).not.toContain(page);
    }
  });

  it('keeps scheduled posts out of lists, feeds, sitemap and tag pages', () => {
    const scheduled = dated.filter((p) => !isLive(p));
    const surfaces = files.filter((f) => /\.(html|xml)$/.test(f) && f !== '404.html');
    for (const p of scheduled) {
      if (previewBuild && p.approval !== 'vetoed') continue;
      const slug = slugOf(p.file);
      for (const f of surfaces) expect(read(f), `${f} mentions scheduled ${slug}`).not.toContain(`/${slug}/`);
    }
  });

  it('publishes both languages of every pair together', () => {
    for (const ref of new Set(dated.map((p) => p.ref))) {
      const pair = dated.filter((p) => p.ref === ref);
      const live = pair.map((p) => files.includes(`${urlOf(p).slice(1)}index.html`));
      expect(new Set(live).size, `only one language of ${ref} is published`).toBe(1);
    }
  });
});
