// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { initMenu, initThemeToggle, nextTheme, resolveTheme, THEME_KEY } from '../../src/scripts/theme';

describe('theme helpers', () => {
  it('resolves stored values first, then the system preference', () => {
    expect(resolveTheme('light', false)).toBe('light');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('auto', true)).toBe('light');
    expect(resolveTheme(null, false)).toBe('dark');
  });

  it('toggles', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme(undefined)).toBe('light');
  });
});

describe('initThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.dataset['theme'] = 'dark';
    window.localStorage.clear();
  });

  it('switches the theme, stores it and updates aria-pressed', () => {
    document.body.innerHTML = '<button data-theme-toggle aria-pressed="false">Theme</button>';
    expect(initThemeToggle(document, window)).toBe(1);
    const button = document.querySelector('button')!;
    button.click();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    button.click();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('keeps working when storage throws', () => {
    document.body.innerHTML = '<button data-theme-toggle>Theme</button>';
    const fakeWin = {
      document,
      get localStorage(): Storage {
        throw new Error('blocked');
      },
    } as unknown as Window;
    initThemeToggle(document, fakeWin);
    document.querySelector('button')!.click();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});

describe('initMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button data-menu-button aria-controls="nav" aria-expanded="false">Menu</button>
      <div id="nav"><a href="#features">Features</a></div>`;
  });

  it('opens, closes on link click and on Escape', () => {
    expect(initMenu(document, window)).toBe(true);
    const button = document.querySelector<HTMLButtonElement>('button')!;
    const panel = document.getElementById('nav')!;
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.dataset['open']).toBe('true');
    panel.querySelector('a')!.click();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    panel.click();
    expect(panel.dataset['open']).toBe('false');
  });

  it('returns false without a menu', () => {
    document.body.innerHTML = '';
    expect(initMenu(document, window)).toBe(false);
  });
});
