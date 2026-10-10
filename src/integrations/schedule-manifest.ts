import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { readPostDates } from '../../scripts/post-dates.mjs';
import { scheduleManifest, type Approval } from '../lib/schedule';

export const MANIFEST_FILE = '.schedule.json';

/**
 * Writes `dist/.schedule.json` after the build. `builtAt` is taken when the build starts, so a post
 * that falls due while the build runs is listed as "next" and the sync rebuilds once more (safe),
 * never the other way round.
 */
export function scheduleManifestIntegration(): AstroIntegration {
  let root = process.cwd();
  let builtAt = new Date();
  return {
    name: 'schedule-manifest',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:build:start': () => {
        builtAt = new Date();
      },
      'astro:build:done': ({ dir }) => {
        const posts = readPostDates(join(root, 'src/content/posts')).map((p) => ({ date: new Date(p.date), approval: p.approval as Approval }));
        const outDir = fileURLToPath(dir);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, MANIFEST_FILE), `${JSON.stringify(scheduleManifest(posts, builtAt), null, 2)}\n`);
      },
    },
  };
}
