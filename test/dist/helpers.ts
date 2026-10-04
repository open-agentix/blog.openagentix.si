import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const DIST = join(process.cwd(), 'dist');

export function assertBuilt(): void {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error('dist/ is missing: run `pnpm build` before `pnpm test:dist`.');
  }
}

/** All files below dist, as forward-slash paths relative to dist. */
export function distFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(relative(DIST, full).split(sep).join('/'));
    }
  };
  walk(DIST);
  return out;
}

export const read = (path: string): string => readFileSync(join(DIST, path), 'utf8');
export const readBytes = (path: string): Buffer => readFileSync(join(DIST, path));
