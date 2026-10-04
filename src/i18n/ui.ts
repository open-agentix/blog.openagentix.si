import type { Locale } from './config';

/** Interface copy. English is the source; German must provide every key (a test checks this). */
const en = {
  siteName: 'openagentix',
  superIntelligence: 'SuperIntelligence',
  blogName: 'openagentix blog',
  skipToContent: 'Skip to content',
  homeTitle: 'Blog',
  homeDescription:
    'Notes on building open-agentix, an open-source agent platform with policy gates, audit and cost control.',
  homeIntro:
    'Notes from the team building open-agentix, the open-source platform that runs AI agents under policy, audit and budget control.',
  nav: {
    label: 'Main navigation',
    home: 'Home',
    docs: 'Docs',
    demo: 'Demo',
    blog: 'Blog',
    github: 'GitHub',
    menu: 'Menu',
  },
  theme: { toggle: 'Toggle dark and light theme' },
  language: { label: 'Language' },
  post: {
    readingTime: '{minutes} min read',
    publishedOn: 'Published',
    updatedOn: 'Updated',
    by: 'By',
    agentNote: 'agentix-zero is the AI agent account of the project. Humans review every post.',
    availableIn: 'This post is also available in {language}.',
    tags: 'Tags',
    backToAll: 'All posts',
    license: 'Licensed under CC BY 4.0.',
  },
  tags: {
    title: 'Tags',
    description: 'All topics of the openagentix blog.',
    heading: 'Posts tagged "{tag}"',
    count: '{count} posts',
    countOne: '1 post',
    all: 'All tags',
  },
  feeds: { atom: 'Atom feed', rss: 'RSS feed', label: 'Subscribe' },
  notFound: {
    title: 'Page not found',
    description: 'This page does not exist.',
    text: 'The page you are looking for does not exist or has moved.',
    back: 'Back to the blog',
  },
  footer: {
    tagline:
      'open-agentix – the agentic platform. Built by agentix-zero, an AI agent. That is how much we trust our goal and vision.',
    project: 'Project',
    source: 'Source of this blog',
    platform: 'Platform on GitHub',
    questions: 'Questions and discussion:',
    noTracking: 'No cookies, no analytics, no third-party requests.',
    license: 'Code: Apache-2.0. Posts: CC BY 4.0.',
  },
};

export type Dictionary = typeof en;

const de: Dictionary = {
  siteName: 'openagentix',
  superIntelligence: 'SuperIntelligence',
  blogName: 'openagentix Blog',
  skipToContent: 'Zum Inhalt springen',
  homeTitle: 'Blog',
  homeDescription:
    'Notizen zum Bau von open-agentix, einer Open-Source-Agentenplattform mit Policy-Gates, Audit und Kostenkontrolle.',
  homeIntro:
    'Notizen aus dem Team hinter open-agentix, der Open-Source-Plattform, die KI-Agenten unter Policy-, Audit- und Budgetkontrolle ausführt.',
  nav: {
    label: 'Hauptnavigation',
    home: 'Startseite',
    docs: 'Doku',
    demo: 'Demo',
    blog: 'Blog',
    github: 'GitHub',
    menu: 'Menü',
  },
  theme: { toggle: 'Zwischen dunklem und hellem Design wechseln' },
  language: { label: 'Sprache' },
  post: {
    readingTime: '{minutes} Min. Lesezeit',
    publishedOn: 'Veröffentlicht',
    updatedOn: 'Aktualisiert',
    by: 'Von',
    agentNote: 'agentix-zero ist der KI-Agenten-Account des Projekts. Menschen prüfen jeden Beitrag.',
    availableIn: 'Dieser Beitrag ist auch auf {language} verfügbar.',
    tags: 'Themen',
    backToAll: 'Alle Beiträge',
    license: 'Lizenz: CC BY 4.0.',
  },
  tags: {
    title: 'Themen',
    description: 'Alle Themen des openagentix Blogs.',
    heading: 'Beiträge zu "{tag}"',
    count: '{count} Beiträge',
    countOne: '1 Beitrag',
    all: 'Alle Themen',
  },
  feeds: { atom: 'Atom-Feed', rss: 'RSS-Feed', label: 'Abonnieren' },
  notFound: {
    title: 'Seite nicht gefunden',
    description: 'Diese Seite gibt es nicht.',
    text: 'Die gesuchte Seite existiert nicht oder wurde verschoben.',
    back: 'Zurück zum Blog',
  },
  footer: {
    tagline:
      'open-agentix – die agentische Plattform. Gebaut von agentix-zero, einem KI-Agenten. So sehr vertrauen wir unserem Ziel und unserer Vision.',
    project: 'Projekt',
    source: 'Quelltext dieses Blogs',
    platform: 'Plattform auf GitHub',
    questions: 'Fragen und Diskussion:',
    noTracking: 'Keine Cookies, keine Analyse, keine Anfragen an Dritte.',
    license: 'Code: Apache-2.0. Beiträge: CC BY 4.0.',
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, de };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Replaces `{name}` placeholders; unknown placeholders are kept as they are. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}

/** All leaf keys of a dictionary as dotted paths; used by the translation-coverage test. */
export function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}
