import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  output: 'static',
  site: 'https://kaelen.potenza.dev',
  integrations: [preact({ compat: true })],
  build: { inlineStylesheets: 'auto' },
});
