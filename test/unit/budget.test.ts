import { describe, expect, it } from 'vitest';
import {
  budget,
  budgetViolations,
  forbiddenImage,
  jsImports,
  pageAssets,
  reachableScripts,
  resolveModule,
} from '../../src/lib/budget';

describe('budget', () => {
  it('collects page assets', () => {
    const html = `
      <link rel="stylesheet" href="/_astro/a.css"><link rel="modulepreload" href="/_astro/c.js">
      <link rel="preload" href="/_astro/f.woff2" as="font" crossorigin>
      <script type="module" src="/_astro/b.js"></script><script>console.log(1)</script>
      <script type="application/json">{"a":1}</script><style>.a{}</style>`;
    const a = pageAssets(html);
    expect(a.scripts).toEqual(['/_astro/b.js', '/_astro/c.js']);
    expect(a.styles).toEqual(['/_astro/a.css']);
    expect(a.preloadedFonts).toEqual(['/_astro/f.woff2']);
    expect(a.inlineScripts).toEqual(['console.log(1)']);
    expect(a.inlineStyles).toEqual(['.a{}']);
  });

  it('follows static and dynamic imports once', () => {
    expect(jsImports('import{a}from"./a.js";import"./b.js";const c=()=>import("../c.js");import x from "pkg"')).toEqual([
      './a.js',
      './b.js',
      '../c.js',
    ]);
    expect(resolveModule('/_astro/x.js', './y.js')).toBe('/_astro/y.js');
    const files: Record<string, string> = {
      '/_astro/a.js': 'import"./b.js";import"./c.js"',
      '/_astro/b.js': 'import"./a.js"',
      '/_astro/c.js': '',
    };
    expect(reachableScripts(['/_astro/a.js', '/_astro/missing.js'], (p) => files[p] ?? null).sort()).toEqual([
      '/_astro/a.js',
      '/_astro/b.js',
      '/_astro/c.js',
    ]);
  });

  it('reports every exceeded limit', () => {
    expect(budgetViolations({ js: 1, css: 1, html: 1, fonts: 1 })).toEqual([]);
    expect(
      budgetViolations({ js: budget.landingJs + 1, css: budget.landingCss + 1, html: budget.landingHtml + 1, fonts: 2 }),
    ).toHaveLength(4);
  });

  it('flags legacy raster formats', () => {
    expect(forbiddenImage.test('a.PNG')).toBe(true);
    expect(forbiddenImage.test('a.avif')).toBe(false);
    expect(forbiddenImage.test('a.webp')).toBe(false);
  });
});
