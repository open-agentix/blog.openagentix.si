import { browserEnv, readPreference, redirectTarget, SESSION_KEY } from '../lib/lang';

/** Runs language detection once on page load. Returns the target URL if a redirect was issued. */
export function runLanguageRedirect(win: Window): string | null {
  const env = browserEnv(win);
  let alreadyDetected = false;
  try {
    alreadyDetected = env.session?.getItem(SESSION_KEY) === '1';
    env.session?.setItem(SESSION_KEY, '1');
  } catch {
    // Without session storage the saved choice is still respected.
  }
  const target = redirectTarget({
    pathname: win.location.pathname,
    saved: readPreference(env),
    languages: win.navigator.languages ?? [win.navigator.language],
    userAgent: win.navigator.userAgent,
    webdriver: win.navigator.webdriver === true,
    alreadyDetected,
  });
  if (target) win.location.replace(target);
  return target;
}
