import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const BASE = readFileSync('src/styles/base.css', 'utf8');

/** Estrae il corpo della prima regola che apre con `intestazione {`,
 *  bilanciando le graffe. Un `toContain` sull'intestazione soltanto
 *  passerebbe anche con un blocco svuotato o con la regola scappata fuori
 *  dal suo `@media`: qui serve guardare dentro. */
function corpo(sorgente: string, intestazione: string): string {
  const apertura = sorgente.indexOf(`${intestazione} {`);
  if (apertura === -1) throw new Error(`non trovata: ${intestazione}`);
  let i = sorgente.indexOf('{', apertura) + 1;
  let profondita = 1;
  const inizio = i;
  while (profondita > 0) {
    if (sorgente[i] === '{') profondita++;
    else if (sorgente[i] === '}') profondita--;
    i++;
  }
  return sorgente.slice(inizio, i - 1);
}

it('la grana è un data-URI usato davvero come sfondo, non una richiesta di rete', () => {
  // Il sito deve funzionare offline: una texture scaricata sarebbe un buco
  // nella cache che si vede solo al tavolo, senza campo.
  // La virgoletta di apertura si ripete come delimitatore di chiusura: il
  // data-URI stesso contiene virgolette singole (gli attributi dell'SVG),
  // quindi va esclusa solo quella scelta come delimitatore, non l'altra.
  expect(BASE).toMatch(
    /background-image:\s*url\((["'])data:image\/svg\+xml,(?:(?!\1)[\s\S])*feTurbulence(?:(?!\1)[\s\S])*\1\)/,
  );
  expect(BASE).not.toMatch(/url\(['"]?https?:/);
});

it('sotto prefers-reduced-motion animazioni e transizioni si spengono davvero', () => {
  const blocco = corpo(BASE, '@media (prefers-reduced-motion: reduce)');
  // Un blocco svuotato farebbe passare un `toContain` sulla sola
  // intestazione: qui si controlla che dentro ci sia lo spegnimento vero.
  expect(blocco).toContain('animation: none !important');
  expect(blocco).toContain('transition: none !important');
});

it('il movimento del puntatore non si accende su touch', () => {
  const blocco = corpo(BASE, '@media (hover: hover) and (pointer: fine)');
  // Su touch `:hover` resta attaccato dopo il tocco: la regola di
  // sollevamento deve stare dentro la guardia, non scappare a livello
  // globale del foglio.
  expect(blocco).toContain('.superficie.livello-1:hover');
  expect(blocco).toContain('box-shadow: var(--ombra-2)');
});
