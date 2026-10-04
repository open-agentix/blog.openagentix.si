export const THEME_KEY = 'oax-blog-theme';
export type Theme = 'dark' | 'light';

export function resolveTheme(stored: string | null, prefersLight: boolean): Theme {
  if (stored === 'dark' || stored === 'light') return stored;
  return prefersLight ? 'light' : 'dark';
}

export function nextTheme(current: string | undefined): Theme {
  return current === 'light' ? 'dark' : 'light';
}

/** Wires every `[data-theme-toggle]` button; returns how many were found. */
export function initThemeToggle(root: ParentNode, win: Window): number {
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
  const html = win.document.documentElement;
  const sync = () => {
    const isLight = html.dataset['theme'] === 'light';
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(isLight)));
  };
  buttons.forEach((button) =>
    button.addEventListener('click', () => {
      const theme = nextTheme(html.dataset['theme']);
      html.dataset['theme'] = theme;
      try {
        win.localStorage.setItem(THEME_KEY, theme);
      } catch {
        // The choice then lasts for this page view only.
      }
      sync();
    }),
  );
  sync();
  return buttons.length;
}

/** Disclosure for the mobile navigation. Closes on Escape and when a link is followed. */
export function initMenu(root: ParentNode, win: Window): boolean {
  const button = root.querySelector<HTMLButtonElement>('[data-menu-button]');
  const panelId = button?.getAttribute('aria-controls');
  const panel = panelId ? win.document.getElementById(panelId) : null;
  if (!button || !panel) return false;
  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    panel.dataset['open'] = String(open);
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (e) => {
    if ((e.target as Element | null)?.closest('a')) set(false);
  });
  win.document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      set(false);
      button.focus();
    }
  });
  set(false);
  return true;
}
