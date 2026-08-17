import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const BASE = readFileSync('src/styles/base.css', 'utf8');

it('la grana è un data-URI, non una richiesta di rete', () => {
  // Il sito deve funzionare offline: una texture scaricata sarebbe un buco
  // nella cache che si vede solo al tavolo, senza campo.
  expect(BASE).toContain('feTurbulence');
  expect(BASE).not.toMatch(/url\(['"]?https?:/);
});

it('ogni animazione si spegne sotto prefers-reduced-motion', () => {
  expect(BASE).toContain('@media (prefers-reduced-motion: reduce)');
});

it('il movimento del puntatore non si accende su touch', () => {
  expect(BASE).toContain('(hover: hover) and (pointer: fine)');
});
