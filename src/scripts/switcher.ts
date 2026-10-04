import { isLocale } from '../i18n/config';
import { browserEnv, writePreference } from '../lib/lang';

export const SWITCH_SELECTOR = '[data-lang-switch] a[data-locale]';

/**
 * Remembers the language whenever the visitor uses the language switch. Navigation itself stays a
 * plain link, so it works without JavaScript. Returns the number of links that were wired up.
 */
export function initLanguageSwitchers(root: ParentNode, win: Window): number {
  const links = root.querySelectorAll<HTMLAnchorElement>(SWITCH_SELECTOR);
  links.forEach((link) =>
    link.addEventListener('click', () => {
      const value = link.dataset['locale'];
      if (isLocale(value)) writePreference(value, browserEnv(win));
    }),
  );
  return links.length;
}
