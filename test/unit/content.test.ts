import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '../../src/i18n/config';
import { validatePosts } from '../../src/lib/posts';

const root = join(process.cwd(), 'src/content/posts');

interface Source {
  file: string;
  lang: string;
  slug: string;
  text: string;
  front: Record<string, string>;
}

function front(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  const out: Record<string, string> = {};
  for (const line of (m?.[1] ?? '').split('\n')) {
    const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (kv) out[kv[1]!] = kv[2]!.replace(/^"|"$/g, '');
  }
  return out;
}

const sources: Source[] = locales.flatMap((lang) =>
  readdirSync(join(root, lang))
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = readFileSync(join(root, lang, f), 'utf8');
      return { file: `${lang}/${f}`, lang, slug: f.replace(/\.md$/, ''), text, front: front(text) };
    }),
);

describe('post sources', () => {
  it('has posts', () => {
    expect(sources.length).toBeGreaterThanOrEqual(10);
  });

  it('declares ref and lang that match the folder, and every ref exists in every language', () => {
    for (const s of sources) expect(s.front['lang'], s.file).toBe(s.lang);
    const problems = validatePosts(sources.map((s) => ({ ref: s.front['ref']!, lang: s.lang as 'en' | 'de', slug: s.slug })));
    expect(problems).toEqual([]);
  });

  it('keeps tags identical across translations so the tag pages line up', () => {
    const byRef = new Map<string, Set<string>>();
    for (const s of sources) {
      const tags = (s.front['tags'] ?? '').replace(/[[\]]/g, '').split(',').map((t) => t.trim()).sort().join(',');
      byRef.set(s.front['ref']!, (byRef.get(s.front['ref']!) ?? new Set()).add(tags));
    }
    for (const [ref, variants] of byRef) expect(variants.size, ref).toBe(1);
  });

  it('keeps titles and descriptions within the limits search engines display', () => {
    for (const s of sources) {
      expect(s.front['title']!.length, s.file).toBeLessThanOrEqual(110);
      expect(s.front['description']!.length, s.file).toBeGreaterThanOrEqual(40);
      expect(s.front['description']!.length, s.file).toBeLessThanOrEqual(220);
    }
  });

  it('contains no personal data: only the project contact address may appear', () => {
    for (const s of sources) {
      const emails = [...s.text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)].map((m) => m[0].toLowerCase());
      expect(emails.filter((e) => e !== 'info@openagentix.si'), s.file).toEqual([]);
    }
  });

  it('keeps inline SVG diagrams accessible and self-contained', () => {
    for (const s of sources) {
      for (const [svg] of s.text.matchAll(/<svg\b[\s\S]*?<\/svg>/g)) {
        expect(svg, s.file).toMatch(/^<svg\b[^>]*\brole="img"/);
        const labelledBy = svg.match(/^<svg\b[^>]*\baria-labelledby="([^"]+)"/)?.[1]?.split(' ') ?? [];
        expect(labelledBy.length, s.file).toBe(2);
        expect(svg, s.file).toContain(`<title id="${labelledBy[0]}">`);
        expect(svg, s.file).toContain(`<desc id="${labelledBy[1]}">`);
        expect(svg, s.file).not.toMatch(/\b(?:xlink:)?href\s*=|url\(\s*["']?(?:https?:)?\/\//i);
        // Colours come from the page (currentColor and design tokens), so both themes work.
        expect(svg, s.file).not.toMatch(/\b(?:fill|stroke)="#[0-9a-f]{3,8}"/i);
      }
      // A blank line would end the HTML block in Markdown and break the figure.
      for (const [figure] of s.text.matchAll(/<figure\b[\s\S]*?<\/figure>/g)) expect(figure, s.file).not.toMatch(/\n\s*\n/);
    }
  });

  it('carries no tool attribution lines and no remote includes', () => {
    for (const s of sources) {
      expect(s.text, s.file).not.toMatch(/Co-Authored-By|Claude-Session|Generated with/i);
      expect(s.text, s.file).not.toMatch(/<(script|iframe|img)\b/i);
    }
  });
});
