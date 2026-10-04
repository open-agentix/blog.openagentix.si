import { describe, expect, it } from 'vitest';
import { extractHrefs, extractIds, findBrokenLinks, resolveHref } from '../../src/lib/link-check';

describe('link check', () => {
  it('extracts hrefs and ids', () => {
    expect(extractHrefs(`<a href="/a/">a</a><link rel="x" href='/b.css'><a href="?q=1&amp;x=2">q</a>`)).toEqual([
      '/a/',
      '/b.css',
      '?q=1&x=2',
    ]);
    expect([...extractIds(`<h2 id="intro"></h2><div id='x'></div>`)]).toEqual(['intro', 'x']);
  });

  it('resolves relative and absolute hrefs, skips external ones', () => {
    expect(resolveHref('de/index.html', 'demo/')).toEqual({ path: 'de/demo/index.html', hash: '' });
    expect(resolveHref('docs/a/index.html', '../b/#x')).toEqual({ path: 'docs/b/index.html', hash: 'x' });
    expect(resolveHref('index.html', '/favicon.svg')).toEqual({ path: 'favicon.svg', hash: '' });
    expect(resolveHref('index.html', '#features')).toEqual({ path: 'index.html', hash: 'features' });
    expect(resolveHref('index.html', 'https://github.com/x')).toBeNull();
    expect(resolveHref('index.html', 'mailto:a@b.c')).toBeNull();
    expect(resolveHref('index.html', '//cdn.example/x')).toBeNull();
  });

  it('reports missing pages and anchors', () => {
    const pages = [
      { file: 'index.html', html: '<a href="/docs/">d</a><a href="/nope/">n</a><a href="#top">t</a><a href="/docs/#gone">g</a><a href="/docs">s</a>' },
      { file: 'docs/index.html', html: '<h1 id="intro">x</h1><a href="/#top">h</a>' },
    ];
    const files = new Set(['index.html', 'docs/index.html']);
    expect(findBrokenLinks(pages, files)).toEqual([
      { file: 'index.html', href: '/nope/', reason: 'missing-page' },
      { file: 'index.html', href: '#top', reason: 'missing-anchor' },
      { file: 'index.html', href: '/docs/#gone', reason: 'missing-anchor' },
      { file: 'docs/index.html', href: '/#top', reason: 'missing-anchor' },
    ]);
  });
});
