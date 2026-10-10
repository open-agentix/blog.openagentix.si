// Reads the publication data of the posts straight from the Markdown front matter, without Astro.
// Shared by the next-slot CLI and the build manifest so both see exactly the same posts.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

function field(frontMatter, name) {
  const match = frontMatter.match(new RegExp(`^${name}:[ \\t]*(.+?)[ \\t]*(?:#.*)?$`, 'm'));
  return match ? match[1].replace(/^(["'])(.*)\1$/, '$2') : undefined;
}

/**
 * @param {string} postsDir directory with one sub-folder per language, e.g. `src/content/posts`
 * @returns {{ file: string, ref: string, lang: string, date: string, approval: string }[]} raw front matter values (`approval` defaults to `none`)
 */
export function readPostDates(postsDir) {
  const out = [];
  for (const lang of readdirSync(postsDir, { withFileTypes: true })) {
    if (!lang.isDirectory()) continue;
    for (const name of readdirSync(join(postsDir, lang.name)).filter((n) => n.endsWith('.md'))) {
      const file = join(postsDir, lang.name, name);
      const fm = readFileSync(file, 'utf8').match(FRONT_MATTER)?.[1];
      const ref = fm && field(fm, 'ref');
      const date = fm && field(fm, 'date');
      if (!ref || !date) throw new Error(`${file}: front matter needs "ref" and "date"`);
      out.push({ file, ref, lang: field(fm, 'lang') ?? lang.name, date, approval: field(fm, 'approval') ?? 'none' });
    }
  }
  return out;
}
