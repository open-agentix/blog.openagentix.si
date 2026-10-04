/** Performance budget for the built site (SPEC.md "Look & speed"). Sizes are gzip bytes. */
export interface Budget {
  /** All JavaScript a landing page loads, including inline scripts and imported chunks. */
  landingJs: number;
  /** All CSS a landing page loads, including inline styles. */
  landingCss: number;
  /** The HTML document itself. */
  landingHtml: number;
  /** Fonts preloaded per page; more than one delays first render. */
  preloadedFonts: number;
}

export const budget: Budget = {
  landingJs: 100 * 1024,
  landingCss: 60 * 1024,
  landingHtml: 80 * 1024,
  preloadedFonts: 1,
};

/** Raster formats that must not ship; images are SVG/CSS or AVIF/WebP. */
export const forbiddenImage = /\.(png|jpe?g|gif|bmp|tiff?)$/i;

export interface PageAssets {
  scripts: string[];
  styles: string[];
  inlineScripts: string[];
  inlineStyles: string[];
  preloadedFonts: string[];
}

const attrValue = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? null) : null;
};

export function pageAssets(html: string): PageAssets {
  const scripts: string[] = [];
  const styles: string[] = [];
  const preloadedFonts: string[] = [];
  for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = attrValue(tag, 'src');
    if (src) scripts.push(src);
  }
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (attrValue(tag, 'rel') ?? '').toLowerCase();
    const href = attrValue(tag, 'href');
    if (!href) continue;
    if (rel === 'stylesheet') styles.push(href);
    if (rel === 'modulepreload') scripts.push(href);
    if (rel === 'preload' && attrValue(tag, 'as') === 'font') preloadedFonts.push(href);
  }
  const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1] ?? '',
  );
  const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1] ?? '');
  return { scripts: [...new Set(scripts)], styles: [...new Set(styles)], inlineScripts, inlineStyles, preloadedFonts };
}

/** Relative module specifiers a JS chunk imports statically or dynamically. */
export function jsImports(code: string): string[] {
  const out = new Set<string>();
  for (const m of code.matchAll(/(?:\bimport\s*\(?\s*|\bfrom\s*)["'](\.{1,2}\/[^"']+|\/[^"']+)["']/g)) out.add(m[1]!);
  return [...out];
}

/** Resolves a specifier from a module URL path (both site-absolute, e.g. `/_astro/a.js`). */
export function resolveModule(fromPath: string, spec: string): string {
  return new URL(spec, `https://site.invalid${fromPath}`).pathname;
}

/** All JS paths reachable from the entry scripts. `read` returns the code for a site path. */
export function reachableScripts(entries: readonly string[], read: (path: string) => string | null): string[] {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    const code = read(path);
    if (code === null) continue;
    seen.add(path);
    for (const spec of jsImports(code)) queue.push(resolveModule(path, spec));
  }
  return [...seen];
}

export interface Measured {
  js: number;
  css: number;
  html: number;
  fonts: number;
}

export function budgetViolations(m: Measured, b: Budget = budget): string[] {
  const v: string[] = [];
  if (m.js > b.landingJs) v.push(`JS ${m.js} B > ${b.landingJs} B`);
  if (m.css > b.landingCss) v.push(`CSS ${m.css} B > ${b.landingCss} B`);
  if (m.html > b.landingHtml) v.push(`HTML ${m.html} B > ${b.landingHtml} B`);
  if (m.fonts > b.preloadedFonts) v.push(`${m.fonts} preloaded fonts > ${b.preloadedFonts}`);
  return v;
}
