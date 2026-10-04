import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { budgetViolations, forbiddenImage, pageAssets, reachableScripts } from '../../src/lib/budget';
import { assertBuilt, distFiles, read, readBytes } from './helpers';

const gz = (s: string | Buffer) => gzipSync(s, { level: 9 }).length;
const toFile = (sitePath: string) => sitePath.replace(/^\//, '');

describe('performance budget', () => {
  assertBuilt();
  const files = new Set(distFiles());
  const pages = [...files].filter((f) => f.endsWith('.html') && f !== '404.html');

  it.each(pages)('%s stays within the budget', (page) => {
    const html = read(page);
    const assets = pageAssets(html);
    const scripts = reachableScripts(assets.scripts, (p) => (files.has(toFile(p)) ? read(toFile(p)) : null));
    const js = scripts.reduce((sum, p) => sum + gz(read(toFile(p))), 0) + assets.inlineScripts.reduce((s, c) => s + gz(c), 0);
    const css =
      assets.styles.reduce((sum, p) => sum + gz(read(toFile(p))), 0) + assets.inlineStyles.reduce((s, c) => s + gz(c), 0);
    const measured = { js, css, html: gz(html), fonts: assets.preloadedFonts.length };
    // A blog page is far smaller than a landing page; keep a tighter limit than the shared budget.
    expect(budgetViolations(measured, { landingJs: 20 * 1024, landingCss: 20 * 1024, landingHtml: 40 * 1024, preloadedFonts: 1 })).toEqual([]);
  });

  it('ships no raster images except the pre-rendered social card', () => {
    expect([...files].filter((f) => forbiddenImage.test(f) && f !== 'og.png')).toEqual([]);
  });

  it('ships the social card at a sensible size', () => {
    expect(readBytes('og.png').length).toBeLessThan(250 * 1024);
  });

  it('ships only subset fonts', () => {
    const fonts = [...files].filter((f) => f.endsWith('.woff2'));
    expect(fonts.length).toBeLessThanOrEqual(4);
    for (const f of fonts) expect(readBytes(f).length).toBeLessThan(60 * 1024);
  });
});
