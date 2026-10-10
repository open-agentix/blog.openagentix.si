import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { locales } from './i18n/config';
import { DEFAULT_AUTHOR } from './project';
import { approvals } from './lib/schedule';

const posts = defineCollection({
  // src/content/posts/<lang>/<slug>.md; the file name (without extension) is the slug in the URL.
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    /** Stable id shared by every translation of one post. */
    ref: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    lang: z.enum(locales),
    title: z.string().min(5).max(110),
    description: z.string().min(40).max(220),
    date: z.coerce.date(),
    /** Owner decision, set in the file: `approved` releases the post before its date, `vetoed` holds it back. */
    approval: z.enum(approvals).default('none'),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string().min(2)).min(1).max(6),
    author: z.string().default(DEFAULT_AUTHOR),
  }),
});

export const collections = { posts };
