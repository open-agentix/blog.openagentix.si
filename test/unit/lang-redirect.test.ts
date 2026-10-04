// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runLanguageRedirect } from '../../src/scripts/lang-redirect';
import { SESSION_KEY, STORAGE_KEY } from '../../src/lib/lang';

const fakeWindow = (over: { pathname?: string; languages?: string[]; ua?: string } = {}) => {
  const replace = vi.fn();
  const win = {
    location: { pathname: over.pathname ?? '/', replace },
    navigator: {
      languages: over.languages ?? ['de'],
      language: 'de',
      userAgent: over.ua ?? 'Mozilla/5.0 Chrome/130',
      webdriver: false,
    },
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
  } as unknown as Window;
  return { win, replace };
};

describe('runLanguageRedirect', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('redirects once per session based on the browser language', () => {
    const first = fakeWindow();
    expect(runLanguageRedirect(first.win)).toBe('/de/');
    expect(first.replace).toHaveBeenCalledWith('/de/');
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe('1');
    const second = fakeWindow();
    expect(runLanguageRedirect(second.win)).toBeNull();
    expect(second.replace).not.toHaveBeenCalled();
  });

  it('prefers the saved choice', () => {
    window.localStorage.setItem(STORAGE_KEY, 'en');
    window.sessionStorage.setItem(SESSION_KEY, '1');
    const { win, replace } = fakeWindow({ pathname: '/de/' });
    expect(runLanguageRedirect(win)).toBe('/');
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('falls back to navigator.language and tolerates blocked session storage', () => {
    const replace = vi.fn();
    const win = {
      location: { pathname: '/', replace },
      navigator: { language: 'de', userAgent: 'Mozilla/5.0 Chrome/130' },
      get localStorage(): Storage {
        throw new Error('blocked');
      },
      get sessionStorage(): Storage {
        throw new Error('blocked');
      },
    } as unknown as Window;
    expect(runLanguageRedirect(win)).toBe('/de/');
  });
});
