import { existsSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const CSS = readFileSync('src/styles/componenti.css', 'utf8');

/** Il costruito, per guardare cosa esiste *prima* dell'idratazione. */
const scheda = (): string => {
  if (!existsSync('dist/scheda/index.html')) {
    throw new Error('dist/scheda/index.html non esiste: lancia npm run build.');
  }
  return readFileSync('dist/scheda/index.html', 'utf8');
};

/** Il corpo della prima regola che apre con `selettore {`. */
function corpo(selettore: string): string {
  const apertura = CSS.indexOf(`${selettore} {`);
  if (apertura === -1) throw new Error(`regola non trovata: ${selettore}`);
  const chiusura = CSS.indexOf('}', apertura);
  return CSS.slice(apertura, chiusura);
}

it('l’altezza riservata sta su markup statico, non sull’isola', () => {
  // La trappola in cui questa guardia era già caduta una volta: l'altezza era
  // dichiarata su `.vitalita-scheda`, che è il bottone disegnato da Preact.
  // Con `client:only` quel bottone non esiste finché il JavaScript non gira,
  // quindi la riserva valeva per un elemento assente e la pagina saltava lo
  // stesso. Deve stare su un contenitore che il build scrive nell'HTML.
  expect(scheda()).toContain('class="vitalita-isola"');
  expect(corpo('.vitalita-isola')).toMatch(/height:\s*\d+px/);
});

it('l’altezza riservata della vitalità è la somma delle sue parti', () => {
  // Le altre altezze riservate di questo progetto sono numeri *misurati* con
  // Chrome headless, e una è già segnalata come incerta perché nessuna
  // sessione recente ha avuto un browser. Questa no: è una somma di costanti
  // dichiarate, e questo test la fa tornare. Se qualcuno cambia una riga senza
  // aggiornare il totale, fallisce il gate invece di far saltare la pagina
  // alla prima idratazione.
  const blocco = corpo('.vitalita-isola');

  const parti = [...blocco.matchAll(/--v-[a-z]+:\s*(\d+)px/g)].map((m) => Number(m[1]));
  const totale = /height:\s*(\d+)px/.exec(blocco);

  expect(parti).toHaveLength(7);
  if (!totale) throw new Error('altezza fissa non dichiarata');
  expect(parti.reduce((a, b) => a + b, 0)).toBe(Number(totale[1]));
});

it('ogni parte è usata davvero dal layout, non solo dichiarata', () => {
  // Una variabile che nessuno consuma è un numero che mente: la somma
  // tornerebbe mentre il layout fa altro.
  for (const nome of ['testata', 'numero', 'metro', 'tacche', 'piede']) {
    expect(CSS).toContain(`var(--v-${nome})`);
  }
});

it('i bersagli della modale non scendono sotto i 44px', () => {
  // Il minimo per un dito. Le righe sono 56 e i verbi 76; i comandi dentro le
  // righe sono 40, ma il bersaglio vero lì è la riga.
  expect(corpo('dialog.vitalita .riga')).toMatch(/height:\s*56px/);
  expect(corpo('dialog.vitalita .verbi button')).toMatch(/height:\s*76px/);
  expect(corpo('dialog.vitalita .digita')).toMatch(/height:\s*44px/);
});

it('il passo della rotella nel CSS combacia con quello del modulo', () => {
  // `PASSO` in src/lib/rotella.ts vale 40: se la cifra nel CSS fosse alta
  // diversamente, la conversione fra posizione e numero indicherebbe la
  // cifra sbagliata e la rotella sembrerebbe fermarsi in mezzo.
  const passo = /export const PASSO = (\d+);/.exec(readFileSync('src/lib/rotella.ts', 'utf8'));
  if (!passo) throw new Error('PASSO non trovato');

  expect(corpo('.rotella .cifra')).toMatch(new RegExp(`height:\\s*${passo[1]}px`));
  expect(corpo('.rotella .banda')).toMatch(new RegExp(`height:\\s*${passo[1]}px`));
});
