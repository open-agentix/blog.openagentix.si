import { describe, expect, it, vi } from 'vitest';
import { whenIdle } from '../../src/scripts/defer';

function fakeWin(readyState: string, idle: boolean) {
  const listeners: Record<string, () => void> = {};
  const win = {
    document: { readyState },
    addEventListener: (type: string, cb: () => void) => void (listeners[type] = cb),
    requestIdleCallback: idle ? (cb: () => void) => cb() : undefined,
    setTimeout: (cb: () => void) => cb(),
  } as unknown as Window;
  return { win, listeners };
}

describe('whenIdle', () => {
  it('waits for the load event, then for idle time', () => {
    const task = vi.fn();
    const { win, listeners } = fakeWin('interactive', true);
    whenIdle(win, task);
    expect(task).not.toHaveBeenCalled();
    listeners['load']!();
    expect(task).toHaveBeenCalledOnce();
  });

  it('runs right away on a loaded page and falls back to setTimeout', () => {
    const task = vi.fn();
    whenIdle(fakeWin('complete', false).win, task);
    expect(task).toHaveBeenCalledOnce();
  });
});
