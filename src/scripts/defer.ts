/**
 * Runs `task` once the page has loaded and the browser is idle, so non-critical scripts never
 * compete with the first paint. Falls back to a short timeout where requestIdleCallback is missing.
 */
export function whenIdle(win: Window, task: () => void, timeout = 1500): void {
  const schedule = () => {
    if (typeof win.requestIdleCallback === 'function') win.requestIdleCallback(task, { timeout });
    else win.setTimeout(task, 1);
  };
  if (win.document.readyState === 'complete') schedule();
  else win.addEventListener('load', schedule, { once: true });
}
