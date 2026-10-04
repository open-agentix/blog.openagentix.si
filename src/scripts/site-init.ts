import { initLanguageSwitchers } from './switcher';
import { initMenu, initThemeToggle } from './theme';

/** Wires the interactive parts of the page. Everything else works without JavaScript. */
export function initSite(root: ParentNode, win: Window): void {
  initThemeToggle(root, win);
  initMenu(root, win);
  initLanguageSwitchers(root, win);
}
