// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { initLanguageSwitchers } from '../../src/scripts/switcher';
import { STORAGE_KEY } from '../../src/lib/lang';

describe('initLanguageSwitchers', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = '';
  });

  it('stores the locale of a clicked header link', () => {
    document.body.innerHTML = `
      <nav data-lang-switch>
        <a href="/" data-locale="en">English</a>
        <a href="/de/" data-locale="de">Deutsch</a>
      </nav>`;
    expect(initLanguageSwitchers(document, window)).toBe(2);
    const de = document.querySelector<HTMLAnchorElement>('a[data-locale="de"]')!;
    de.addEventListener('click', (e) => e.preventDefault());
    de.click();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('de');
  });

  it('ignores links with unknown locales', () => {
    document.body.innerHTML = `<div data-lang-switch><a href="/sl/" data-locale="sl">SL</a></div>`;
    initLanguageSwitchers(document, window);
    const link = document.querySelector('a')!;
    link.addEventListener('click', (e) => e.preventDefault());
    link.click();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('wires nothing on pages without switchers', () => {
    expect(initLanguageSwitchers(document, window)).toBe(0);
  });
});
