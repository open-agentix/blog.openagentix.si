import { defineConfig } from 'vitest/config';

// Checks that run against the production build in dist/ (run `pnpm build` first).
export default defineConfig({
  test: {
    include: ['test/dist/**/*.test.ts'],
    environment: 'node',
  },
});
