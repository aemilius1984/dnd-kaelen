import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

  const righe = ['numero', 'metro', 'tacche', 'piede'];
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
  for (const nome of ['numero', 'metro', 'tacche', 'piede']) {
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
  // Il difetto che ha fatto sembrare rotta tutta la Vitalità. Il browser tiene
  // chiuso un <dialog> con `display: none` nel proprio foglio di stile:
  // dichiarare `display: flex` sulla regola base lo scavalca, e il contenuto
  // della modale finisce dentro la pagina, sempre visibile.
  //
  // La prima versione di questa guardia cercava `dialog` nel *selettore*. Una
  // modale con una regola scritta per sola classe — `.arma-piena`, non
  // `dialog.arma-piena` — le passava sotto il naso senza un fallimento, e la
  // seconda modale del progetto è nata esattamente così. Quindi si parte dal
  // markup: quali classi stanno davvero su un <dialog>.
  const sorgenti = [
    ...readdirSync('src/components')
      .filter((f) => f.endsWith('.astro'))
      .map((f) => `src/components/${f}`),
    ...readdirSync('src/islands')
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => `src/islands/${f}`),
  ].map((f) => readFileSync(f, 'utf8'));

  const classi = new Set<string>();
  for (const sorgente of sorgenti) {
    for (const [, valore] of sorgente.matchAll(/<dialog[^>]*\sclass(?:Name)?="([^"]+)"/g)) {
      for (const c of valore.split(/\s+/)) if (c) classi.add(c);
    }
  }
  expect(classi.size).toBeGreaterThan(0);

  // Solo i blocchi `<style>`, non i file interi: le graffe di JSX e del
  // frontmatter sfasano l'accoppiamento selettore/corpo e la scansione finisce
  // a guardare pezzi di template. È la seconda cecità di questa guardia.
  const fogli = [
    CSS,
    ...sorgenti.flatMap((testo) =>
      [...testo.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]),
    ),
  ]
    .join('\n')
    // Via i commenti. Quel che sta fra una graffa chiusa e la successiva aperta
    // comprende il commento della regola, e questa guardia ci cerca dentro
    // `[open]`: il commento che *spiega* la regola contiene quelle parole, e la
    // guardia si assolveva leggendo la propria spiegazione. Presa così una
    // volta, su questa stessa modale.
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  let controllate = 0;
  const violazioni: string[] = [];

  // Niente `(^|\})` davanti: quel `}` veniva consumato dalla regola
  // precedente, e siccome due match non si sovrappongono la scansione ne
  // saltava una sì e una no. Il selettore è già `[^{}]*`, che comincia da solo
  // dopo la graffa di chiusura di prima.
  for (const [, selettore, corpoRegola] of fogli.matchAll(/([^{}]*)\{([^}]*)\}/g)) {
    // Solo le regole che vestono il dialogo stesso, non i suoi discendenti:
    // `.arma-piena .testa` può dichiarare quel che vuole.
    const vesteIlDialogo = [...classi].some((c) =>
      new RegExp(`\\.${c}(\\[[^\\]]*\\])*\\s*(,|$)`).test(selettore.trim()),
    );
    if (!vesteIlDialogo) continue;
    controllate += 1;
    if (!/display\s*:/.test(corpoRegola)) continue;
    if (!/\[open\]/.test(selettore)) violazioni.push(selettore.trim().split('\n').pop()!.trim());
  }

  // Tutte insieme: lanciare dentro il ciclo ferma alla prima e nasconde le altre.
  expect(violazioni).toEqual([]);

  // Se il riconoscimento delle regole smettesse di funzionare, il ciclo qui
  // sopra non ne guarderebbe nessuna e il test passerebbe dicendo niente.
  expect(controllate).toBeGreaterThanOrEqual(classi.size);
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

it('la rotella non passa alla modale quel che avanza del gesto', () => {
  // Scorrere *oltre* l'ultimo numero incatenava lo scorrimento al genitore: la
  // modale scendeva, e il gesto per tornare indietro andava a rimettere a
  // posto lei invece di girare la rotella. Da fuori si legge come «da trenta
  // non si torna più indietro».
  expect(corpo('.rotella .pista')).toMatch(/overscroll-behavior:\s*contain/);
});

it('la barra degli slot si appiccica al contenitore, non alla radice dell’isola', () => {
  // Un elemento `sticky` alto quanto il proprio blocco contenitore non ha
  // spazio dove restare e se ne va con lo scorrimento: misurato in Chrome,
  // scendeva a −233px invece di fermarsi. La radice dell'isola è figlia unica
  // del contenitore e ne riempie l'altezza, quindi `sticky` va sul contenitore
  // — che è anche l'unico che il build scrive, e che quindi può riservare
  // l'altezza prima dell'idratazione.
  expect(corpo('.barra-slot-isola')).toMatch(/position:\s*sticky/);
  // 49px: 48 di area premibile del riassunto più il filetto di sotto. Non è
  // ricavato a mente, è letto in Chrome a 390x844 — e riletto dopo che
  // attacco e CD sono entrati nella riga, che l'altezza non l'ha cambiata.
  expect(corpo('.barra-slot-isola')).toMatch(/min-height:\s*49px/);
  // La barra dell'isola una regola adesso ce l'ha (`display: contents`, che
  // le fa attraversare la griglia del cappello), ma non è lei ad appiccicarsi.
  expect(corpo('.barra-slot')).not.toMatch(/position:\s*sticky/);
});

it('la riga del cappello tiene i due numeri e il conto senza accavallarli', () => {
  // Misurato in Chrome a 390x844: «Attacco +5 · CD 13» arriva a 135px, il
  // riassunto parte da 151. Sedici pixel di margine non sono molti, ed è per
  // questo che i due numeri non vanno a capo — spezzarli raddoppierebbe
  // l'altezza del cappello proprio a metà scorrimento.
  expect(corpo('.barra-slot-isola')).toMatch(/grid-template-columns:\s*auto 1fr/);
  expect(corpo('.attacco-inc')).toMatch(/white-space:\s*nowrap/);
  // Le file aperte scavalcano la colonna di destra e si prendono i 358px
  // pieni: dentro ci vanno le caselle grandi, che a metà larghezza non
  // starebbero.
  expect(corpo('.barra-slot .file')).toMatch(/grid-area:\s*2 \/ 1 \/ auto \/ -1/);
});

it('il cappello dell’archivio si appiccica come la barra degli slot', () => {
  // Stessa forma e stessa ragione: `sticky` sul contenitore, che è l'unico che
  // il build scrive e quindi l'unico che può riservare l'altezza prima che
  // l'isola scriva conto e comando. Sulla barra fatta dall'isola non
  // funzionerebbe — è figlia unica del contenitore e ne riempie l'altezza,
  // quindi non ha spazio dove restare.
  expect(corpo('.barra-preparati-isola')).toMatch(/position:\s*sticky/);
  expect(corpo('.barra-preparati-isola')).toMatch(/min-height:\s*\d+px/);
  expect(corpo('.barra-preparati-isola')).toMatch(/box-shadow:/);
  expect(() => corpo('.barra-preparati')).not.toThrow();
  expect(corpo('.barra-preparati')).not.toMatch(/position:\s*sticky/);
});

it('le file della barra degli slot partono tutte dalla stessa colonna', () => {
  // In numeri romani «I» e «VIII» sono larghi il doppio l'uno dell'altro: senza
  // una colonna dichiarata, ogni fila di caselle partirebbe da un punto suo.
  // E le regole di `.risorsa` stavano dentro `.striscia-risorse`, che non
  // esiste più — la fila era rimasta senza layout del tutto.
  expect(corpo('.barra-slot .risorsa')).toMatch(/grid-template-columns:\s*[\d.]+rem\s+1fr/);
  expect(corpo('.barra-slot .risorsa')).toMatch(/gap:/);
});

it('i due numeri del conto sono della stessa misura', () => {
  // «6/6» sono la stessa cosa detta due volte: a due corpi diversi
  // litigano. A distinguerli bastano colore e peso.
  expect(corpo('.barra-slot .conto strong')).not.toMatch(/font-size:/);
});

it('la barra si legge come un foglio sopra la pagina', () => {
  // Sovrapposizione: sotto ci scorre il contenuto, e senza ombra il confine
  // fra i due è solo un filetto da un pixel.
  expect(corpo('.barra-slot-isola')).toMatch(/box-shadow:/);
});

/** Un foglio senza commenti: la guardia contro il numero magico cerca cifre,
 *  e un commento che *racconta* il vecchio numero la farebbe fallire per la
 *  sola colpa di spiegarsi. */
function senzaCommenti(percorso: string): string {
  return readFileSync(percorso, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
}

it('il cappello è un token solo, non tre numeri copiati', () => {
  // `3.25rem` era scritto a mano in tre punti e `3.75rem` in altri tre: la
  // barra del menu, i due cappelli di sezione che si appiccicano sotto di lei,
  // e gli scarti che le pagine le riservano. Sei numeri che devono muoversi
  // insieme e nessuno che li tenga. Adesso l'altezza della barra include la
  // tacca, quindi muoverli insieme non è più eleganza: è la differenza fra un
  // menu leggibile e un menu sotto l'orologio.
  const tokens = senzaCommenti('src/styles/tokens.css');
  expect(tokens).toMatch(/--tacca:\s*env\(safe-area-inset-top,\s*0px\)/);
  expect(tokens).toMatch(/--cappello:\s*calc\(3\.25rem \+ var\(--tacca\)\)/);

  const menu = senzaCommenti('src/components/Menu.astro');
  const barra = menu.slice(menu.indexOf('.barra {'), menu.indexOf('}', menu.indexOf('.barra {')));
  expect(barra).toMatch(/height:\s*var\(--cappello\)/);
  // Senza questo, il contenuto della barra resta centrato sull'altezza intera
  // e finisce metà sotto la tacca.
  expect(barra).toMatch(/padding-top:\s*var\(--tacca\)/);

  for (const foglio of [
    'src/styles/componenti.css',
    'src/styles/base.css',
    'src/styles/storia.css',
    'src/components/Menu.astro',
  ]) {
    expect(senzaCommenti(foglio)).not.toMatch(/3\.25rem|3\.75rem/);
  }
});

it('i cappelli di sezione si fermano sotto la barra anche quando si ritira', () => {
  // Lo stato ritirato era `top: 0`, che con la tacca accesa vuol dire «sotto
  // l'orologio». Sono due regole in due punti lontani del foglio e correggerne
  // una sola lascia una rotta rotta a metà: questa guardia le tiene appaiate.
  for (const cappello of ['.barra-slot-isola', '.barra-preparati-isola']) {
    expect(corpo(cappello)).toMatch(/top:\s*var\(--cappello\)/);
    expect(corpo(`body:has(.barra[data-nascosta]) ${cappello}`)).toMatch(/top:\s*var\(--tacca\)/);
  }
});
