import { describe, expect, it } from 'vitest';
import { scanFile } from '../../src/lib/external-scan';
import { OWN_HOSTS } from '../../src/project';
import { assertBuilt, distFiles, read } from './helpers';

// The built blog must not make the browser contact any third-party host, and must not track.
describe('built blog makes no third-party requests', () => {
  assertBuilt();
  const own = [...OWN_HOSTS];
  const files = distFiles().filter((f) => /\.(html|css|m?js)$/.test(f));

  it('has files to scan', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('references no third-party hosts in script, link, media, @import or url()', () => {
    const findings = files.flatMap((file) => scanFile(file, read(file), own).map((r) => `${file}: ${r.kind} ${r.url}`));
    expect(findings).toEqual([]);
  });

  it('sets no cookies and contains no analytics or tracking code', () => {
    const scripts = files.filter((f) => /\.(m?js|html)$/.test(f));
    const hits = scripts.flatMap((f) => {
      const text = read(f);
      return [/document\.cookie/, /gtag\(|google-analytics|googletagmanager|plausible|matomo|umami|fathom|hotjar/i, /navigator\.sendBeacon/]
        .filter((re) => re.test(text))
        .map((re) => `${f}: ${re}`);
    });
    expect(hits).toEqual([]);
  });
});

describe('no personal data in the build', () => {
  assertBuilt();
  const text = distFiles().filter((f) => /\.(html|xml|txt)$/.test(f));

  it('contains no e-mail address except the project contact', () => {
    const found = new Set<string>();
    for (const f of text) {
      for (const m of read(f).matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) found.add(m[0].toLowerCase());
    }
    expect([...found].filter((e) => e !== 'github@openagentix.si')).toEqual([]);
  });
});
