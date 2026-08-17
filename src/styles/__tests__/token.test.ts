import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TOKENS = readFileSync('src/styles/tokens.css', 'utf8');

function definiti(): Set<string> {
  return new Set([...TOKENS.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));
}

function file(cartella: string, estensioni: string[]): string[] {
  return readdirSync(cartella).flatMap((nome) => {
    const p = join(cartella, nome);
    if (statSync(p).isDirectory()) return file(p, estensioni);
    return estensioni.some((e) => nome.endsWith(e)) ? [p] : [];
  });
}

/** Luminanza relativa e contrasto secondo WCAG 2.1. Vive nel test e non in
 *  `lib` perché è uno strumento di verifica, non una regola di gioco. */
function contrasto(a: string, b: string): number {
  const luminanza = (hex: string) => {
    const canali = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, bl] = canali.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [luminanza(a), luminanza(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

function valore(nome: string): string {
  const m = TOKENS.match(new RegExp(`${nome}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`Token assente o non esadecimale: ${nome}`);
  return m[1];
}

it('ogni token usato è un token dichiarato', () => {
  const dichiarati = definiti();
  const orfani = new Set<string>();

  for (const p of [...file('src/styles', ['.css']), ...file('src', ['.astro', '.tsx'])]) {
    const testo = readFileSync(p, 'utf8');
    for (const m of testo.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      if (!dichiarati.has(m[1])) orfani.add(`${m[1]} in ${p}`);
    }
  }

  // Una rinomina che dimentica un consumatore non rompe la build: il colore
  // sparisce e basta, e te ne accorgi guardando la pagina giusta.
  expect([...orfani]).toEqual([]);
});

describe('contrasto delle coppie che si leggono davvero', () => {
  const coppie: [string, string][] = [
    ['--inchiostro', '--carta'],
    ['--inchiostro', '--superficie'],
    ['--inchiostro', '--superficie-incassata'],
    ['--inchiostro-tenue', '--carta'],
    ['--inchiostro-tenue', '--superficie'],
    ['--inchiostro-muto', '--superficie'],
    ['--lampo', '--carta'],
    ['--lampo', '--superficie'],
  ];

  for (const [testo, fondo] of coppie) {
    it(`${testo} su ${fondo} sta ad almeno 4,5:1`, () => {
      expect(contrasto(valore(testo), valore(fondo))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
