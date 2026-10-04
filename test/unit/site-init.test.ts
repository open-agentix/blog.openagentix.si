// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { initSite } from '../../src/scripts/site-init';

describe('initSite', () => {
  it('wires theme toggle, menu and language links', () => {
    document.body.innerHTML = `
      <button data-theme-toggle></button>
      <button data-menu-button aria-controls="nav" aria-expanded="false"></button>
      <nav id="nav"></nav>
      <nav data-lang-switch><a href="/de/" data-locale="de">DE</a></nav>`;
    initSite(document, window);
    document.documentElement.dataset['theme'] = 'dark';
    document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click();
    expect(document.documentElement.dataset['theme']).toBe('light');
    document.querySelector<HTMLButtonElement>('[data-menu-button]')!.click();
    expect(document.getElementById('nav')!.dataset['open']).toBe('true');
  });
});
