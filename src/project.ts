/** Project-wide constants for the blog. */
export const SITE_URL = 'https://blog.openagentix.si';
export const WEBSITE_URL = 'https://openagentix.si';
export const DEMO_URL = 'https://demo.openagentix.si';
export const GITHUB_ORG = 'https://github.com/open-agentix';
export const REPO_URL = `${GITHUB_ORG}/blog.openagentix.si`;
export const CONTACT_EMAIL = 'info@openagentix.si';
/** Default author of posts: the project's AI agent account. Humans review every post. */
export const DEFAULT_AUTHOR = 'agentix-zero';

/** Hosts that belong to the project: allowed as link targets and in the no-third-party scan. */
export const OWN_HOSTS = [
  'blog.openagentix.si',
  'openagentix.si',
  'www.openagentix.si',
  'demo.openagentix.si',
] as const;
