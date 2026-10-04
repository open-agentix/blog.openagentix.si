/** Locales of the blog. English is the default and lives at the site root. */
export const locales = ['en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export interface LocaleInfo {
  code: Locale;
  /** Name of the language in that language, shown in the switcher. */
  nativeName: string;
  /** BCP 47 tag for `lang` and `hreflang` attributes. */
  bcp47: string;
  /** `og:locale` value. */
  ogLocale: string;
  /** Locale used for date formatting. */
  dateLocale: string;
  /** Reading speed in words per minute. */
  wordsPerMinute: number;
}

export const localeInfo: Record<Locale, LocaleInfo> = {
  en: { code: 'en', nativeName: 'English', bcp47: 'en', ogLocale: 'en_GB', dateLocale: 'en-GB', wordsPerMinute: 220 },
  de: { code: 'de', nativeName: 'Deutsch', bcp47: 'de', ogLocale: 'de_DE', dateLocale: 'de-DE', wordsPerMinute: 190 },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
