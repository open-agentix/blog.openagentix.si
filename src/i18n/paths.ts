import { defaultLocale, isLocale, locales, type Locale } from './config';

/** Root-relative URL prefix of a locale: empty for the default locale, `/de` otherwise. */
export function prefixFor(locale: Locale): string {
  return locale === defaultLocale ? '' : `/${locale}`;
}

export const paths = {
  home: (locale: Locale): string => `${prefixFor(locale)}/`,
  post: (locale: Locale, slug: string): string => `${prefixFor(locale)}/posts/${slug}/`,
  tags: (locale: Locale): string => `${prefixFor(locale)}/tags/`,
  tag: (locale: Locale, tag: string): string => `${prefixFor(locale)}/tags/${tag}/`,
  atom: (locale: Locale): string => `${prefixFor(locale)}/feed.xml`,
  rss: (locale: Locale): string => `${prefixFor(locale)}/rss.xml`,
} as const;

/** Absolute URL for a root-relative path. */
export function absolute(path: string, site: string | URL): string {
  return new URL(path, site).href;
}

/** Locale a root-relative path belongs to (`/de/...` is German, everything else is English). */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/')[1];
  return isLocale(first) && first !== defaultLocale ? first : defaultLocale;
}

/** The same path in another locale for the pages that exist in every locale (home, tags index). */
export function swapLocale(pathname: string, target: Locale): string {
  const current = localeFromPath(pathname);
  const rest = current === defaultLocale ? pathname : pathname.slice(`/${current}`.length);
  return `${prefixFor(target)}${rest.startsWith('/') ? rest : `/${rest}`}`;
}

export const allLocales = locales;
