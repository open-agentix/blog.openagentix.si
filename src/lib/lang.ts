import { defaultLocale, isLocale, locales, type Locale } from '../i18n/config';
import { localeFromPath, swapLocale } from '../i18n/paths';

export const STORAGE_KEY = 'oax-blog-lang';
export const SESSION_KEY = 'oax-blog-lang-detected';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

/** Lower-cased primary subtags in preference order, duplicates removed (`de-AT` becomes `de`). */
export function primaryLanguages(languages: readonly string[]): string[] {
  const out: string[] = [];
  for (const tag of languages) {
    const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
    if (primary && primary !== '*' && !out.includes(primary)) out.push(primary);
  }
  return out;
}

/** The first browser language the blog supports, otherwise the default locale. */
export function negotiate(languages: readonly string[], supported: readonly Locale[] = locales): Locale {
  for (const primary of primaryLanguages(languages)) {
    const hit = supported.find((l) => l === primary);
    if (hit) return hit;
  }
  return defaultLocale;
}

/** Crawlers, link unfurlers, audit tools and automated browsers are never redirected. */
const BOT_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|preview|lighthouse|pagespeed|headless|phantomjs|puppeteer|playwright|selenium|curl|wget|python-requests|httpclient|validator/i;

export function isBot(userAgent: string, webdriver = false): boolean {
  return webdriver || userAgent.trim() === '' || BOT_PATTERN.test(userAgent);
}

export interface RedirectInput {
  pathname: string;
  /** Language the visitor picked in the switcher earlier, if any. */
  saved: Locale | null;
  /** `navigator.languages`. */
  languages: readonly string[];
  userAgent: string;
  webdriver?: boolean;
  /** True once detection already ran in this browser session. */
  alreadyDetected: boolean;
}

/**
 * Where to send the visitor, or `null` to stay. Only the home page and the tags index take part:
 * a link to a specific post or language is always respected.
 * - A saved choice always wins (it was made explicitly).
 * - Without a saved choice, the browser language applies once per session, on default-locale pages.
 * - Bots are never redirected.
 */
export function redirectTarget(input: RedirectInput): string | null {
  if (isBot(input.userAgent, input.webdriver)) return null;
  const path = input.pathname;
  const current = localeFromPath(path);
  const bare = swapLocale(path, defaultLocale);
  if (bare !== '/' && bare !== '/tags/') return null;

  let desired: Locale | null = input.saved;
  if (!desired && !input.alreadyDetected && current === defaultLocale) desired = negotiate(input.languages);
  if (!desired || desired === current) return null;
  return swapLocale(path, desired);
}

export interface PreferenceEnv {
  storage: KeyValueStore | null;
  session: KeyValueStore | null;
}

/** The language the visitor chose explicitly. Only localStorage is used: the blog sets no cookies. */
export function readPreference(env: Pick<PreferenceEnv, 'storage'>): Locale | null {
  try {
    const stored = env.storage?.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writePreference(locale: Locale, env: Pick<PreferenceEnv, 'storage'>): boolean {
  if (!isLocale(locale)) return false;
  try {
    if (!env.storage) return false;
    env.storage.setItem(STORAGE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}

/** Collects storage handles defensively; either of them can throw when site data is blocked. */
export function browserEnv(win: Window): PreferenceEnv {
  const safe = <T>(get: () => T): T | null => {
    try {
      return get();
    } catch {
      return null;
    }
  };
  return { storage: safe(() => win.localStorage), session: safe(() => win.sessionStorage) };
}
