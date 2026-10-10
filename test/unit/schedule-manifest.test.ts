import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { MANIFEST_FILE, scheduleManifestIntegration } from '../../src/integrations/schedule-manifest';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function site(dateOfPair: string, extra = ''): string {
  const root = mkdtempSync(join(tmpdir(), 'blog-manifest-'));
  dirs.push(root);
  for (const lang of ['en', 'de']) {
    mkdirSync(join(root, 'src/content/posts', lang), { recursive: true });
    writeFileSync(join(root, 'src/content/posts', lang, 'x.md'), `---\nref: x\nlang: ${lang}\ndate: ${dateOfPair}\n${extra}---\nbody\n`);
  }
  return root;
}

async function build(root: string): Promise<{ builtAt: string; nextPublishAt: string | null }> {
  const integration = scheduleManifestIntegration();
  const hooks = integration.hooks as unknown as Record<string, (arg: unknown) => unknown>;
  const dist = join(root, 'dist');
  await hooks['astro:config:done']?.({ config: { root: pathToFileURL(`${root}/`) } });
  await hooks['astro:build:start']?.({});
  await hooks['astro:build:done']?.({ dir: pathToFileURL(`${dist}/`) });
  return JSON.parse(readFileSync(join(dist, MANIFEST_FILE), 'utf8'));
}

describe('schedule manifest integration', () => {
  it('writes the next publish instant of a scheduled pair', async () => {
    const manifest = await build(site('2099-01-05T07:00:00+01:00'));
    expect(manifest.nextPublishAt).toBe('2099-01-05T06:00:00.000Z');
    expect(Date.parse(manifest.builtAt)).toBeLessThanOrEqual(Date.now());
  });

  it('ignores approved and vetoed pairs for the rebuild instant', async () => {
    expect((await build(site('2099-01-05T07:00:00+01:00', 'approval: approved\n'))).nextPublishAt).toBeNull();
    expect((await build(site('2099-01-05T07:00:00+01:00', 'approval: vetoed\n'))).nextPublishAt).toBeNull();
  });

  it('writes null when nothing is scheduled', async () => {
    expect((await build(site('2020-01-07T07:00:00+01:00'))).nextPublishAt).toBeNull();
  });
});
