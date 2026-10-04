import { describe, expect, it } from 'vitest';
import { findBrokenLinks } from '../../src/lib/link-check';
import { assertBuilt, distFiles, read } from './helpers';

describe('internal links', () => {
  assertBuilt();
  const files = distFiles();
  const pages = files.filter((f) => f.endsWith('.html')).map((file) => ({ file, html: read(file) }));

  it('every same-site link and anchor resolves to a built file', () => {
    expect(findBrokenLinks(pages, new Set(files))).toEqual([]);
  });

  it('links Home, Docs and Demo back to the project on every page', () => {
    for (const { file, html } of pages) {
      expect(html, file).toContain('href="https://openagentix.si/');
      expect(html, file).toContain('/docs/"');
      expect(html, file).toContain('href="https://demo.openagentix.si/');
    }
  });
});
