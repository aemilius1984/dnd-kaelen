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

// Il file dichiara ogni token due volte, uno per tema: un match senza scopo
// prenderebbe il primo per ordine nel file, non per intenzione. Pergamena è
// l'unico tema attivo (Tempesta è dormiente), quindi è l'unico che le prove
// di contrasto devono misurare — a prescindere da quale blocco viene prima.
const PERGAMENA = TOKENS.slice(
  TOKENS.indexOf("data-tema='pergamena'"),
  TOKENS.indexOf("data-tema='tempesta'"),
);

function valore(nome: string): string {
  const m = PERGAMENA.match(new RegExp(`${nome}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`Token assente o non esadecimale nel blocco pergamena: ${nome}`);
  return m[1];
}

/** Le proprietà personalizzate che un'isola dichiara nel proprio `style={{…}}`.
 *
 *  Nascono in un file e vivono in un altro: `ControlliLancio` passa al CSS la
 *  durata del proprio timer, così il numero della finestra per annullare è
 *  scritto una volta sola invece che una in TypeScript e una in CSS — due
 *  numeri che si sarebbero scollati alla prima modifica, lasciando una barra
 *  che finisce prima o dopo il diritto che racconta.
 *
 *  Restano comunque coperte: rinominarne una da un lato solo lascia l'altro
 *  lato orfano, e il test qui sotto se ne accorge. */
function daIsole(): Set<string> {
  const nomi = new Set<string>();
  for (const p of file('src', ['.tsx'])) {
    for (const m of readFileSync(p, 'utf8').matchAll(/['"](--[a-z0-9-]+)['"]\s*:/g)) {
      nomi.add(m[1]);
    }
  }
  return nomi;
}

it('ogni token usato è un token dichiarato', () => {
  const dichiarati = new Set([...definiti(), ...daIsole()]);
  const orfani = new Set<string>();

  for (const p of file('src', ['.css', '.astro', '.tsx'])) {
    const testo = readFileSync(p, 'utf8');
    // Non ogni `--nome` è un token: un componente può dichiararsi una
    // variabile propria — l'indice di riga che sfalsa un'animazione, per
    // dire — e passarsela fra il suo markup e il suo CSS. Quella non
    // appartiene al vocabolario e non deve entrare in `tokens.css`, che il
    // test qui accanto tiene pulito. Vale la stessa regola dei moduli: è
    // orfano ciò che nessuno dichiara, non ciò che dichiara chi lo usa.
    const locali = new Set([...testo.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    for (const m of testo.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      if (!dichiarati.has(m[1]) && !locali.has(m[1])) orfani.add(`${m[1]} in ${p}`);
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
    ['--ambra', '--carta'],
    ['--ambra', '--superficie-incassata'],
    ['--inchiostro-muto', '--superficie-incassata'],
  ];

  for (const [testo, fondo] of coppie) {
    it(`${testo} su ${fondo} sta ad almeno 4,5:1 in pergamena`, () => {
      expect(contrasto(valore(testo), valore(fondo))).toBeGreaterThanOrEqual(4.5);
    });
  }
});
