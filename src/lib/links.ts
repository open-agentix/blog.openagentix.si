import type { Locale } from '../i18n/config';
import { defaultLocale } from '../i18n/config';
import { DEMO_URL, WEBSITE_URL } from '../project';

export interface ProjectLink {
  id: 'home' | 'docs' | 'demo';
  href: string;
}

/** Links back to the main website, the documentation and the live demo, in the visitor's language. */
export function projectLinks(locale: Locale): ProjectLink[] {
  const prefix = locale === defaultLocale ? '' : `/${locale}`;
  return [
    { id: 'home', href: `${WEBSITE_URL}${prefix}/` },
    { id: 'docs', href: `${WEBSITE_URL}${prefix}/docs/` },
    { id: 'demo', href: `${DEMO_URL}${prefix}/` },
  ];
}
