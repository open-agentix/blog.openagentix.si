/**
 * Finds references that would make a visitor's browser contact a third-party host:
 * `<script src>`, `<link href>`, media `src`/`srcset`/`poster`, `<iframe>`/`<object>`, CSS `@import`
 * and `url()`, and dynamic `import()`/`fetch()`/`importScripts()` with absolute URLs in JS.
 * Plain `<a href>` links are navigation, not requests, and are not reported.
 */
export type RefKind = 'script' | 'link' | 'media' | 'frame' | 'css-import' | 'css-url' | 'js';

export interface ExternalRef {
  kind: RefKind;
  url: string;
}

const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

export function hostOf(url: string): string | null {
  if (!ABSOLUTE.test(url)) return null;
  try {
    return new URL(url.startsWith('//') ? `https:${url}` : url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** True when the URL points to a host other than the site's own hosts. Relative and data: URLs are local. */
export function isThirdParty(url: string, ownHosts: readonly string[]): boolean {
  const host = hostOf(url.trim());
  return host !== null && !ownHosts.map((h) => h.toLowerCase()).includes(host);
}

function collect(content: string, pattern: RegExp, kind: RefKind, group = 1): ExternalRef[] {
  const out: ExternalRef[] = [];
  for (const m of content.matchAll(pattern)) {
    const raw = m[group];
    if (!raw) continue;
    // srcset holds comma-separated candidates; each one starts with a URL.
    for (const candidate of raw.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) out.push({ kind, url });
    }
  }
  return out;
}

const attr = (name: string) => `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`;

function collectAttr(html: string, tag: string, name: string, kind: RefKind): ExternalRef[] {
  const re = new RegExp(`<${tag}\\b[^>]*?${attr(name)}`, 'gi');
  const out: ExternalRef[] = [];
  for (const m of html.matchAll(re)) {
    const value = m[1] ?? m[2] ?? m[3];
    if (value) out.push(...collect(value, /^([\s\S]*)$/g, kind));
  }
  return out;
}

export function cssRefs(css: string): ExternalRef[] {
  return [
    ...collect(css, /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi, 'css-import'),
    ...collect(css, /url\(\s*["']?([^"')]+?)["']?\s*\)/gi, 'css-url'),
  ];
}

export function jsRefs(js: string): ExternalRef[] {
  return collect(
    js,
    /(?:\bimport\s*\(\s*|\bimport\s*["']|\bfrom\s*["']|\bfetch\s*\(\s*|\bimportScripts\s*\(\s*|new\s+(?:Worker|EventSource|WebSocket)\s*\(\s*)["'`]?((?:https?:|wss?:)?\/\/[^"'`\s)]+)/g,
    'js',
  );
}

export function htmlRefs(html: string): ExternalRef[] {
  const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1] ?? '');
  const styleAttrs = [...html.matchAll(/\sstyle\s*=\s*"([^"]*)"/gi)].map((m) => m[1] ?? '');
  const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1] ?? '',
  );
  return [
    ...collectAttr(html, 'script', 'src', 'script'),
    ...collectAttr(html, 'link', 'href', 'link'),
    ...['img', 'source', 'video', 'audio', 'track', 'embed', 'input'].flatMap((tag) => [
      ...collectAttr(html, tag, 'src', 'media'),
      ...collectAttr(html, tag, 'srcset', 'media'),
    ]),
    ...collectAttr(html, 'video', 'poster', 'media'),
    ...collectAttr(html, 'iframe', 'src', 'frame'),
    ...collectAttr(html, 'object', 'data', 'frame'),
    ...[...styles, ...styleAttrs].flatMap(cssRefs),
    ...inlineScripts.flatMap(jsRefs),
  ];
}

export function scanFile(path: string, content: string, ownHosts: readonly string[]): ExternalRef[] {
  const refs = path.endsWith('.css') ? cssRefs(content) : /\.(m?js)$/.test(path) ? jsRefs(content) : htmlRefs(content);
  return refs.filter((r) => isThirdParty(r.url, ownHosts));
}
