// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import { SITE_URL } from './src/project.ts';
import { scheduleManifestIntegration } from './src/integrations/schedule-manifest.ts';

// Canonical origin used for canonical URLs, hreflang links, feeds and the sitemap.
const site = process.env.SITE_URL ?? SITE_URL;

export default defineConfig({
  site,
  // Writes dist/.schedule.json (next publication instant) for the deploy sync.
  integrations: [scheduleManifestIntegration()],
  trailingSlash: 'always',
  // CSS is inlined: no render-blocking stylesheet requests on first load (see lighthouserc.json).
  build: { format: 'directory', inlineStylesheets: 'always' },
  // Posts use SVG, CSS and one pre-rendered social card; no raster processing at build time.
  image: { service: passthroughImageService() },
  devToolbar: { enabled: false },
  markdown: {
    // Highlighting happens at build time (Shiki); the browser receives plain HTML and CSS only.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
