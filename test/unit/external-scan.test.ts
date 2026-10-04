import { describe, expect, it } from 'vitest';
import { cssRefs, hostOf, htmlRefs, isThirdParty, jsRefs, scanFile } from '../../src/lib/external-scan';

const own = ['openagentix.si'];

describe('external scan', () => {
  it('classifies hosts', () => {
    expect(hostOf('https://Fonts.googleapis.com/css')).toBe('fonts.googleapis.com');
    expect(hostOf('//cdn.example/x.js')).toBe('cdn.example');
    expect(hostOf('/local.js')).toBeNull();
    expect(hostOf('https://[bad')).toBeNull();
    expect(isThirdParty('https://openagentix.si/x', own)).toBe(false);
    expect(isThirdParty('data:image/svg+xml,abc', own)).toBe(false);
    expect(isThirdParty('https://cdn.jsdelivr.net/x.js', own)).toBe(true);
  });

  it('finds scripts, stylesheets, media, frames and inline css/js', () => {
    const html = `
      <script src="https://cdn.example/a.js"></script>
      <script type="module" src="/_astro/b.js"></script>
      <link rel="stylesheet" href='https://fonts.googleapis.com/css2?family=Inter'>
      <link rel="canonical" href="https://openagentix.si/">
      <img src=https://img.example/i.png srcset="/a.avif 1x, https://img.example/b.webp 2x">
      <video poster="https://img.example/p.webp"></video>
      <iframe src="https://www.youtube.com/embed/x"></iframe>
      <object data="https://obj.example/o"></object>
      <div style="background:url('https://bg.example/x.webp')"></div>
      <style>@import url("https://css.example/a.css"); .a{background:url(/local.svg)}</style>
      <script>import("https://esm.example/m.js")</script>
      <script type="application/json">{"u":"https://json.example"}</script>
      <a href="https://github.com/open-agentix">GitHub</a>`;
    const found = htmlRefs(html)
      .filter((r) => isThirdParty(r.url, own))
      .map((r) => `${r.kind}:${hostOf(r.url)}`);
    expect(found).toEqual(
      expect.arrayContaining([
        'script:cdn.example',
        'link:fonts.googleapis.com',
        'media:img.example',
        'frame:www.youtube.com',
        'frame:obj.example',
        'css-url:bg.example',
        'css-import:css.example',
        'js:esm.example',
      ]),
    );
    expect(found.some((f) => f.includes('github.com'))).toBe(false);
    expect(found.some((f) => f.includes('openagentix.si'))).toBe(false);
    expect(found.some((f) => f.includes('json.example'))).toBe(false);
    expect(found.filter((f) => f === 'media:img.example')).toHaveLength(3);
  });

  it('scans css and js files by extension', () => {
    expect(cssRefs('@import "https://x.example/a.css";').map((r) => r.kind)).toEqual(['css-import']);
    expect(jsRefs('fetch("https://api.example/v1"); import x from "./y.js"; new Worker("//w.example/w.js")')).toHaveLength(2);
    expect(scanFile('a.css', 'a{background:url(https://x.example/i.webp)}', own)).toHaveLength(1);
    expect(scanFile('a.mjs', 'fetch("https://x.example")', own)).toHaveLength(1);
    expect(scanFile('a.html', '<script src="/x.js"></script>', own)).toEqual([]);
  });
});
