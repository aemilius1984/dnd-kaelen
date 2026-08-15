/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'functions/**/*.test.ts'],
    // Node 22+ defines a global `localStorage` gated behind a CLI flag; when it
    // wins over jsdom's own implementation, `localStorage` reads as undefined in
    // jsdom-environment tests. Disabling it here lets jsdom's version through
    // without requiring anyone to remember an env var to run the tests.
    execArgv: ['--no-experimental-webstorage'],
  },
});
