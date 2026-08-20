import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  // `.wrangler/` è la cartella temporanea di `wrangler pages dev`: bundle
  // generati, non codice del repo. È già in `.gitignore`, ma eslint non lo
  // legge — e chi aveva lanciato il server locale si ritrovava il cancello
  // rosso per centonovantuno errori in file che non ha scritto.
  { ignores: ['dist/', '.astro/', '.wrangler/', 'node_modules/', 'public/'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // Template for dist/sw.js: __PRECACHE__ is a build-time placeholder
    // replaced by scripts/build-sw.mjs, not a real identifier.
    files: ['src/sw-template.js'],
    languageOptions: { globals: { ...globals.serviceworker, __PRECACHE__: 'readonly' } },
  },
];
