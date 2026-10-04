import { describe, expect, it } from 'vitest';
import { assertBuilt, read } from './helpers';

describe('header wordmark', () => {
  assertBuilt();
  it.each(['index.html', 'de/index.html'])('%s shows the wordmark with a decorative purple full stop', (file) => {
    const html = read(file);
    expect(html).toMatch(/open<span class="blue[^"]*"[^>]*>agentix<\/span><span class="dot[^"]*"[^>]*aria-hidden="true"[^>]*>\.<\/span>/);
    expect(html).toContain('SuperIntelligence');
    // The dot is decorative: never part of the link's accessible name or the page title.
    expect(html).not.toContain('aria-label="openagentix."');
    expect(html).not.toMatch(/<title>[^<]*openagentix\./);
  });
});
