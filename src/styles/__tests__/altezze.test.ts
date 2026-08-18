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
  // Le altre riserve di questo progetto sono numeri *misurati* con Chrome
  // headless, e una è già segnalata come incerta perché nessuna sessione
  // recente ha avuto un browser. Questa no: è aritmetica dichiarata.
  //
  // La somma conta anche gli interstizi. Prima le righe si staccavano con dei
  // margini, che stanno *fuori* dall'altezza dichiarata: il totale tornava
  // sulla carta e sbagliava di diciotto pixel nella scatola vera. Con `gap` lo
  // stacco è una costante come le altre, contata quattro volte.
  const blocco = corpo('.vitalita-isola');
  const px = (nome: string): number => {
    const m = new RegExp(`--v-${nome}:\\s*(\\d+)px`).exec(blocco);
    if (!m) throw new Error(`costante mancante: --v-${nome}`);
    return Number(m[1]);
  };

  const righe = ['testata', 'numero', 'metro', 'tacche', 'piede'];
  const totale = /height:\s*(\d+)px/.exec(blocco);
  if (!totale) throw new Error('altezza fissa non dichiarata');

  const somma =
    righe.reduce((a, nome) => a + px(nome), 0) +
    (righe.length - 1) * px('stacco') +
    px('imbottitura') +
    px('bordi');

  expect(somma).toBe(Number(totale[1]));
});

it('le righe della scheda non hanno margini, o la somma mentirebbe', () => {
  // Un margine su una riga sfuggirebbe al conto qui sopra senza far fallire
  // niente: il totale resterebbe giusto e la scatola vera sarebbe più alta.
  const scheda = CSS.slice(CSS.indexOf('.vitalita-scheda {'), CSS.indexOf('dialog.vitalita {'));
  const righe = scheda.split('.vitalita-scheda ').slice(1);

  for (const regola of righe) {
    expect(regola).not.toMatch(/^\s*[^}]*\bmargin-(top|bottom):/m);
  }
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

it('nessun dialogo dichiara `display` fuori dallo stato aperto', () => {
  // Il difetto che ha fatto sembrare rotta tutta la sezione. Il browser tiene
  // chiuso un <dialog> con `display: none` nel proprio foglio di stile:
  // dichiarare `display: flex` sulla regola base lo scavalca, e il contenuto
  // della modale finisce dentro la pagina, sempre visibile, sotto la scheda.
  //
  // `dialog.archivio`, che funziona da sempre, non dichiara `display`: era lì
  // l'esempio giusto da copiare.
  const regole = [...CSS.matchAll(/(^|\})([^{}]*dialog[^{}]*)\{([^}]*)\}/g)];
  expect(regole.length).toBeGreaterThan(0);

  for (const [, , selettore, corpoRegola] of regole) {
    if (!/display\s*:/.test(corpoRegola)) continue;
    // Concesso solo dove lo stato aperto è nel selettore, o su un discendente
    // che non è il dialogo stesso.
    const suDialogoChiuso = /dialog[a-z.-]*\s*(,|\{|$)/.test(selettore.trim() + '{');
    if (suDialogoChiuso) {
      expect(selettore).toMatch(/\[open\]/);
    }
  }
});

it('la barra del menu ancora la ☰ a destra sull’elemento giusto', () => {
  // `justify-self` vale per gli elementi della griglia. La griglia è `.barra`,
  // e il suo terzo elemento è `details.menu`: metterlo su `summary`, che è
  // dentro, non sposta niente e lascia la ☰ appiccicata a «Storia».
  const menu = readFileSync('src/components/Menu.astro', 'utf8');
  const regolaMenu = menu.slice(menu.indexOf('  .menu {'), menu.indexOf('  summary {'));

  expect(regolaMenu).toContain('justify-self: end');
});
