/** Internal link checker for the static build: every same-site href must hit a file (and anchor). */
export interface Page {
  /** Path relative to dist, e.g. `de/index.html`. */
  file: string;
  html: string;
}

export interface BrokenLink {
  file: string;
  href: string;
  reason: 'missing-page' | 'missing-anchor';
}

const SKIP = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i; // mailto:, https:, data:, protocol-relative

export function extractHrefs(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<(?:a|link)\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const href = (m[1] ?? m[2] ?? '').replace(/&amp;/g, '&');
    if (href) out.push(href);
  }
  return out;
}

export function extractIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const m of html.matchAll(/\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) ids.add(m[1] ?? m[2] ?? '');
  return ids;
}

/** Resolves an href against the page it appears on. Returns null for external or non-page links. */
export function resolveHref(fromFile: string, href: string): { path: string; hash: string } | null {
  if (SKIP.test(href)) return null;
  const base = new URL(`https://site.invalid/${fromFile}`);
  const url = new URL(href, base);
  let path = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (path === '' || path.endsWith('/')) path += 'index.html';
  return { path, hash: decodeURIComponent(url.hash.replace(/^#/, '')) };
}

export function findBrokenLinks(pages: readonly Page[], files: ReadonlySet<string>): BrokenLink[] {
  const idsByFile = new Map(pages.map((p) => [p.file, extractIds(p.html)]));
  const broken: BrokenLink[] = [];
  for (const page of pages) {
    for (const href of extractHrefs(page.html)) {
      const target = resolveHref(page.file, href);
      if (!target) continue;
      let path = target.path;
      if (!files.has(path) && files.has(`${path}/index.html`)) path = `${path}/index.html`;
      if (!files.has(path)) {
        broken.push({ file: page.file, href, reason: 'missing-page' });
        continue;
      }
      const ids = idsByFile.get(path);
      if (target.hash && ids && !ids.has(target.hash)) {
        broken.push({ file: page.file, href, reason: 'missing-anchor' });
      }
    }
  }
  return broken;
}
