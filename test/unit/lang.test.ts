import { describe, expect, it } from 'vitest';
import {
  browserEnv,
  isBot,
  negotiate,
  primaryLanguages,
  readPreference,
  redirectTarget,
  STORAGE_KEY,
  writePreference,
  type RedirectInput,
} from '../../src/lib/lang';

const browser: RedirectInput = {
  pathname: '/',
  saved: null,
  languages: ['de-AT', 'en'],
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36',
  alreadyDetected: false,
};

describe('negotiation', () => {
  it('reduces tags to primary subtags without duplicates or wildcards', () => {
    expect(primaryLanguages(['de-AT', 'DE', 'en_GB', '*', ' '])).toEqual(['de', 'en']);
  });

  it('picks the first supported language and falls back to English', () => {
    expect(negotiate(['fr', 'de-CH'])).toBe('de');
    expect(negotiate(['fr'])).toBe('en');
    expect(negotiate([])).toBe('en');
  });
});

describe('isBot', () => {
  it('recognises crawlers, audit tools and automation', () => {
    expect(isBot('Googlebot/2.1')).toBe(true);
    expect(isBot('Chrome-Lighthouse')).toBe(true);
    expect(isBot('')).toBe(true);
    expect(isBot(browser.userAgent, true)).toBe(true);
    expect(isBot(browser.userAgent)).toBe(false);
  });
});

describe('redirectTarget', () => {
  it('sends a German browser from the English home page to the German one, once', () => {
    expect(redirectTarget(browser)).toBe('/de/');
    expect(redirectTarget({ ...browser, alreadyDetected: true })).toBeNull();
  });

  it('also covers the tags index', () => {
    expect(redirectTarget({ ...browser, pathname: '/tags/' })).toBe('/de/tags/');
    expect(redirectTarget({ ...browser, pathname: '/de/tags/', saved: 'en' })).toBe('/tags/');
  });

  it('lets a saved choice win over the browser language, also in later visits', () => {
    expect(redirectTarget({ ...browser, saved: 'en', alreadyDetected: true })).toBeNull();
    expect(redirectTarget({ ...browser, pathname: '/de/', saved: 'en', alreadyDetected: true })).toBe('/');
    expect(redirectTarget({ ...browser, saved: 'de', alreadyDetected: true })).toBe('/de/');
  });

  it('never moves visitors away from a deep link or a German page without a saved choice', () => {
    expect(redirectTarget({ ...browser, pathname: '/posts/some-post/' })).toBeNull();
    expect(redirectTarget({ ...browser, pathname: '/de/posts/some-post/', saved: 'en' })).toBeNull();
    expect(redirectTarget({ ...browser, pathname: '/de/' })).toBeNull();
  });

  it('stays on the page when the languages already match and never redirects bots', () => {
    expect(redirectTarget({ ...browser, languages: ['en'] })).toBeNull();
    expect(redirectTarget({ ...browser, userAgent: 'Googlebot/2.1' })).toBeNull();
  });
});

describe('preference storage', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  };
  const throwing = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };

  it('stores and reads a valid locale', () => {
    const storage = memory();
    expect(writePreference('de', { storage })).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe('de');
    expect(readPreference({ storage })).toBe('de');
  });

  it('ignores unknown values and survives blocked storage', () => {
    const storage = memory();
    storage.setItem(STORAGE_KEY, 'sl');
    expect(readPreference({ storage })).toBeNull();
    expect(readPreference({ storage: throwing })).toBeNull();
    expect(readPreference({ storage: null })).toBeNull();
    expect(writePreference('de', { storage: throwing })).toBe(false);
    expect(writePreference('de', { storage: null })).toBe(false);
    expect(writePreference('xx' as never, { storage })).toBe(false);
  });

  it('collects storage handles defensively', () => {
    const win = {
      get localStorage(): Storage {
        throw new Error('blocked');
      },
      sessionStorage: memory() as unknown as Storage,
    } as unknown as Window;
    const env = browserEnv(win);
    expect(env.storage).toBeNull();
    expect(env.session).not.toBeNull();
  });
});
