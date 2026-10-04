import { describe, expect, it } from 'vitest';
import { defaultLocale, isLocale, localeInfo, locales } from '../../src/i18n/config';
import { absolute, localeFromPath, paths, prefixFor, swapLocale } from '../../src/i18n/paths';
import { format, getDictionary, keysOf } from '../../src/i18n/ui';
import { projectLinks } from '../../src/lib/links';

describe('locales', () => {
  it('has English as default and knows both languages', () => {
    expect(defaultLocale).toBe('en');
    expect(locales).toEqual(['en', 'de']);
    expect(isLocale('de')).toBe(true);
    expect(isLocale('sl')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    for (const l of locales) expect(localeInfo[l].code).toBe(l);
  });
});

describe('paths', () => {
  it('puts English at the root and German under /de/', () => {
    expect(prefixFor('en')).toBe('');
    expect(prefixFor('de')).toBe('/de');
    expect(paths.home('en')).toBe('/');
    expect(paths.home('de')).toBe('/de/');
    expect(paths.post('de', 'x')).toBe('/de/posts/x/');
    expect(paths.tag('en', 'audit')).toBe('/tags/audit/');
    expect(paths.tags('de')).toBe('/de/tags/');
    expect(paths.atom('en')).toBe('/feed.xml');
    expect(paths.rss('de')).toBe('/de/rss.xml');
  });

  it('builds absolute URLs and detects the locale of a path', () => {
    expect(absolute('/posts/x/', 'https://blog.example.test')).toBe('https://blog.example.test/posts/x/');
    expect(localeFromPath('/de/posts/x/')).toBe('de');
    expect(localeFromPath('/posts/x/')).toBe('en');
    expect(localeFromPath('/en/')).toBe('en');
    expect(localeFromPath('/')).toBe('en');
  });

  it('swaps the locale of a path', () => {
    expect(swapLocale('/tags/', 'de')).toBe('/de/tags/');
    expect(swapLocale('/de/tags/', 'en')).toBe('/tags/');
    expect(swapLocale('/de', 'en')).toBe('/');
    expect(swapLocale('/', 'de')).toBe('/de/');
  });
});

describe('interface copy', () => {
  it('German provides every key of the English dictionary and no extra keys', () => {
    expect(keysOf(getDictionary('de')).sort()).toEqual(keysOf(getDictionary('en')).sort());
  });

  it('has no empty strings', () => {
    for (const l of locales) for (const k of keysOf(getDictionary(l))) expect(k).toBeTruthy();
    const walk = (v: unknown): string[] => (typeof v === 'string' ? [v] : Object.values(v as object).flatMap(walk));
    for (const l of locales) expect(walk(getDictionary(l)).every((s) => s.trim().length > 0)).toBe(true);
  });

  it('formats placeholders and keeps unknown ones', () => {
    expect(format('{a} and {b} and {a}', { a: 1, b: 'x' })).toBe('1 and x and 1');
    expect(format('{missing}', {})).toBe('{missing}');
  });

  it('keysOf returns dotted leaf paths', () => {
    expect(keysOf({ a: { b: 'x', c: 'y' }, d: 'z' })).toEqual(['a.b', 'a.c', 'd']);
  });
});

describe('project links', () => {
  it('points Home, Docs and Demo back to the project in the visitor language', () => {
    expect(projectLinks('en')).toEqual([
      { id: 'home', href: 'https://openagentix.si/' },
      { id: 'docs', href: 'https://openagentix.si/docs/' },
      { id: 'demo', href: 'https://demo.openagentix.si/' },
    ]);
    expect(projectLinks('de').map((l) => l.href)).toEqual([
      'https://openagentix.si/de/',
      'https://openagentix.si/de/docs/',
      'https://demo.openagentix.si/de/',
    ]);
  });
});
