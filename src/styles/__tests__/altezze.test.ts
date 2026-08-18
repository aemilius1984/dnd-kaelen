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
  // Il minimo per un dito. Le righe sono 56; i comandi dentro le righe sono
  // 40, ma il bersaglio vero lì è la riga. I verbi non dichiarano più
  // un'altezza propria — la prendono dalla colonna — e per loro la guardia è
  // l'aritmetica qui sotto, che li tiene sopra gli 80.
  expect(corpo('dialog.vitalita .riga')).toMatch(/height:\s*56px/);
  expect(costante('--pollice-freccia')).toBeGreaterThanOrEqual(44);
});

/** Il valore in px di una costante della zona del pollice. */
function costante(nome: string): number {
  const trovato = new RegExp(`${nome}:\\s*(\\d+)px`).exec(corpo('dialog.vitalita .zona-pollice'));
  if (!trovato) throw new Error(`costante non dichiarata: ${nome}`);
  return Number(trovato[1]);
}

it('le due colonne della zona del pollice sono alte uguali', () => {
  // «Allineato e bilanciato» vuol dire che rotella e verbi cominciano e
  // finiscono sulla stessa riga. Due altezze scritte a mano si scollano al
  // primo ritocco; qui c'è una sola aritmetica, e questa guardia è il posto
  // dove si rompe se qualcuno tocca un termine e non gli altri.
  // L'aritmetica parte dalla rotella: è lei che deve essere alta abbastanza
  // per leggersi, e i tre verbi si dividono la colonna che ne risulta. Prima
  // comandava il verbo, e la rotella prendeva l'avanzo — che è come si era
  // ritrovata alta 164.
  const rotella = costante('--pollice-rotella');
  const stacco = costante('--pollice-stacco');
  const freccia = costante('--pollice-freccia');

  const colonna = rotella + 2 * freccia + 2 * stacco;
  const verbo = (colonna - 2 * stacco) / 3;

  // Un verbo alto meno di 44 non è un bersaglio per un dito.
  expect(verbo).toBeGreaterThanOrEqual(44);

  // La colonna della rotella: freccia, rotella, freccia, con due stacchi.
  expect(freccia * 2 + rotella + stacco * 2).toBe(colonna);
  // E la rotella deve restare abbastanza alta da mostrare la cifra scelta con
  // una sopra e una sotto: sotto tre passi non si legge più come una rotella.
  const passo = passoDelModulo();
  expect(rotella).toBeGreaterThanOrEqual(passo * 4);
  // La banda di selezione sta esattamente in mezzo, e ci deve stare intera.
  // Il conto è sulla scatola interna: i due bordi della rotella stanno dentro
  // l'altezza ma fuori dalla pista, ed è per averli dimenticati che la banda
  // cadeva un pixel sotto la cifra.
  const bordi = 2;
  expect((rotella - bordi - passo) % 2).toBe(0);
  expect(corpo('.rotella')).toMatch(/--scarto:\s*calc\(\(var\(--altezza\) - 2 \* var\(--bordo\)/);
});

/** `PASSO` in src/lib/rotella.ts, la sola fonte del passo. */
function passoDelModulo(): number {
  const passo = /export const PASSO = (\d+);/.exec(readFileSync('src/lib/rotella.ts', 'utf8'));
  if (!passo) throw new Error('PASSO non trovato');
  return Number(passo[1]);
}

it('il passo della rotella nel CSS combacia con quello del modulo', () => {
  // Se il passo nel CSS fosse diverso, la conversione fra posizione e numero
  // indicherebbe la cifra sbagliata e la rotella sembrerebbe fermarsi in
  // mezzo. Nel CSS il passo è dichiarato una volta sola, `--passo`, e da lì
  // scendono cifra, banda e lo scarto sopra e sotto la pista: prima erano
  // quattro numeri copiati che potevano divergere in silenzio.
  expect(corpo('.rotella')).toMatch(new RegExp(`--passo:\\s*${passoDelModulo()}px`));

  for (const regola of ['.rotella .cifra', '.rotella .banda']) {
    expect(corpo(regola)).toMatch(/height:\s*var\(--passo\)/);
  }
  expect(corpo('.rotella .pista')).toMatch(/padding-block:\s*var\(--scarto\)/);
  expect(corpo('.rotella .banda')).toMatch(/top:\s*var\(--scarto\)/);
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

it('i bottoni delle righe sono tutti larghi uguale', () => {
  // Due bottoni che dicono quasi la stessa cosa e finiscono a due larghezze
  // diverse fanno sembrare storta tutta la colonna. Gli esiti dei TS sono
  // l'eccezione dichiarata: là sono due pari che si dividono la riga.
  expect(corpo('dialog.vitalita .riga button')).toMatch(/min-width:\s*108px/);
  expect(corpo('dialog.vitalita .riga-ts .riga-esiti button')).toMatch(/flex:\s*1 1 0/);
});

it('le carte dei verbi sono su due colonne', () => {
  // Impilati, il nome e l'effetto lasciavano vuota tutta la metà destra della
  // carta: a sinistra cosa si sta per fare, a destra cosa comporta.
  const verbo = corpo('dialog.vitalita .verbi button');

  expect(verbo).toMatch(/flex-direction:\s*row/);
  expect(verbo).toMatch(/justify-content:\s*space-between/);
});
