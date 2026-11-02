/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the build works under https://<user>.github.io/opensoko/
  base: './',
  // Top-level await is used to preload sprites before the first frame.
  build: { target: 'es2022' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Verifying the hardest bundled levels means a real solver run, which can take a few seconds.
    testTimeout: 60_000,
  },
});
