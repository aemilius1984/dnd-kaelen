// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import Rotella from '@/islands/Rotella';
import { MASSIMO, MINIMO, PASSO } from '@/lib/rotella';

let radice: HTMLDivElement;
let letto: number[];

const giro = () => new Promise((r) => setTimeout(r, 50));
const pista = () => radice.querySelector<HTMLElement>('.pista')!;

/** jsdom non calcola il layout: `scrollHeight` e `clientHeight` valgono zero,
 *  quindi la pista risulta non scorribile e il componente si rifiuta — a
 *  ragione — di leggerla. Qui le si danno le misure che avrebbe in un browser:
 *  31 cifre da 40px più 212 di imbottitura, in una finestra da 252. */
const disponi = () => {
  Object.defineProperty(pista(), 'scrollHeight', { value: 1452, configurable: true });
  Object.defineProperty(pista(), 'clientHeight', { value: 252, configurable: true });
};

/** Le stesse misure, ma valide già al montaggio: è così che sta il mondo
 *  quando la modale si apre e la pista viene disegnata dentro un dialogo già
 *  aperto. `disponi()` invece arriva dopo, e serve ai casi in cui la pista
 *  compare solo più tardi. Restituisce come rimettere le cose a posto. */
const disponiPrima = (): (() => void) => {
  const veri = ['scrollHeight', 'clientHeight'].map(
    (n) => [n, Object.getOwnPropertyDescriptor(Element.prototype, n)!] as const,
  );
  Object.defineProperty(Element.prototype, 'scrollHeight', { configurable: true, get: () => 1452 });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => 252 });
  return () => {
    for (const [nome, desc] of veri) Object.defineProperty(Element.prototype, nome, desc);
  };
};

const monta = (valore: number) => {
  letto = [];
  render(h(Rotella, { valore, onCambia: (n: number) => letto.push(n) }), radice);
};

beforeEach(() => {
  radice = document.createElement('div');
  document.body.append(radice);
});

afterEach(() => {
  render(null, radice);
  radice.remove();
});

it('offre una cifra per ogni numero dell’intervallo', async () => {
  monta(4);
  await giro();

  expect(radice.querySelectorAll('.cifra')).toHaveLength(MASSIMO - MINIMO + 1);
});

it('si annuncia come selettore di numero, non come lista', async () => {
  // Chi usa un lettore di schermo non può girare niente: senza questo ruolo
  // sentirebbe trentuno numeri sciolti e nessun valore corrente.
  monta(4);
  await giro();

  expect(pista().getAttribute('role')).toBe('spinbutton');
  expect(pista().getAttribute('aria-valuenow')).toBe('4');
  expect(pista().getAttribute('aria-valuemin')).toBe(String(MINIMO));
  expect(pista().getAttribute('aria-valuemax')).toBe(String(MASSIMO));
});

it('scorrere la pista riporta il numero sotto la banda', async () => {
  // Disposta già al montaggio: la rotella nasce dentro una modale aperta. Se
  // comparisse dopo, la prima scorsa servirebbe a rimetterla dov'era e non
  // sarebbe una scelta — ed è il caso provato più sotto.
  const ripristina = disponiPrima();
  try {
    monta(4);
    await giro();

    pista().scrollTop = PASSO * 9;
    pista().dispatchEvent(new Event('scroll'));
    await giro();

    expect(letto).toContain(9);
  } finally {
    ripristina();
  }
});

it('le frecce girano la rotella di una cifra per volta', async () => {
  // La strada da tastiera. Senza, la rotella è un comando che esiste solo
  // per chi ha un dito.
  monta(4);
  await giro();

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await giro();
  expect(letto).toContain(5);

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await giro();
  expect(letto).toContain(3);
});

it('non scavalca gli estremi', async () => {
  monta(MINIMO);
  await giro();

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await giro();

  expect(letto).not.toContain(MINIMO - 1);
});

it('non richiama onCambia se il numero non è cambiato', async () => {
  // `scrollTop` scritto da noi fa scattare un evento `scroll`: senza questa
  // guardia il componente si richiama da solo a ogni riposizionamento.
  monta(4);
  await giro();
  disponi();
  const prima = letto.length;

  pista().scrollTop = PASSO * 4;
  pista().dispatchEvent(new Event('scroll'));
  await giro();

  expect(letto).toHaveLength(prima);
});

it('accetta un intervallo diverso, per il d20 del tiro contro morte', async () => {
  // Una rotella sola per due scopi: la quantità di PF e il dado. Un controllo
  // nuovo sarebbe un gesto in più da imparare proprio nel momento peggiore.
  letto = [];
  render(
    h(Rotella, { valore: 10, minimo: 1, massimo: 20, onCambia: (n: number) => letto.push(n) }),
    radice,
  );
  await giro();

  expect(radice.querySelectorAll('.cifra')).toHaveLength(20);
  expect(pista().getAttribute('aria-valuemin')).toBe('1');
  expect(pista().getAttribute('aria-valuemax')).toBe('20');

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await giro();
  expect(letto).toContain(11);
});

it('non legge la pista prima che il browser l’abbia disposta', async () => {
  // Senza layout la pista non può scorrere, e uno zero letto lì non è una
  // scelta dell'utente: è il vuoto di un elemento non ancora disposto. Preso
  // per buono azzerava la quantità appena scelta — «Spendi 0» al posto di
  // «Spendi 1» appena aperta la modale.
  monta(4);
  await giro();
  const prima = letto.length;

  pista().scrollTop = 0;
  pista().dispatchEvent(new Event('scroll'));
  await giro();

  expect(letto).toHaveLength(prima);
});

const freccia = (verso: 'su' | 'giu') =>
  radice.querySelector<HTMLButtonElement>(`.freccia-${verso}`)!;

it('i bottoni con la freccia girano di uno al click', async () => {
  // La strada col dito, senza dosare un trascinamento — e la sola strada col
  // mouse ora che il campo da digitare non c'è più.
  monta(4);
  await giro();

  freccia('su').click();
  await giro();
  expect(letto).toContain(5);

  freccia('giu').click();
  await giro();
  expect(letto).toContain(3);
});

it('spegne la freccia che porterebbe fuori dall’intervallo', async () => {
  // Un bottone che non fa niente è peggio di un bottone assente: dice che
  // c'è ancora strada dove non ce n'è.
  monta(MASSIMO);
  await giro();

  expect(freccia('su').disabled).toBe(true);
  expect(freccia('giu').disabled).toBe(false);
});

it('non prende per scelta una posizione che non ha mai potuto scrivere', async () => {
  // Il difetto che in pagina si leggeva «SPENDI 0». La modale chiusa tiene la
  // pista fuori dal layout, e lì `scrollTop` scritto non attacca: quando la
  // modale si apre la pista è ferma a zero, e quello zero non è la cifra di
  // nessuno. Preso per buono, azzerava la quantità appena si guardava.
  //
  // Qui la pista si finge fuori dal layout — la scrittura non attacca e la
  // lettura dà sempre zero — e poi le si danno le misure, come all'apertura.
  // In jsdom `scrollTop` è definito su `Element.prototype`, non su quello di
  // `HTMLElement`: cercarlo dove non è restituisce `undefined`, e a rimetterlo
  // a posto il test fallisce per il motivo sbagliato.
  const vero = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop')!;
  Object.defineProperty(Element.prototype, 'scrollTop', {
    configurable: true,
    get: () => 0,
    set: () => {},
  });

  try {
    monta(7);
    await giro();
    disponi();

    pista().dispatchEvent(new Event('scroll'));
    await giro();

    expect(letto).not.toContain(MINIMO);
  } finally {
    Object.defineProperty(Element.prototype, 'scrollTop', vero);
  }
});

it('non si blocca se la posizione riletta non è identica a quella scritta', async () => {
  // Il sintomo: arrivati in fondo alla corsa, la rotella non torna più
  // indietro. La causa sta nella guardia contro le posizioni mai scritte, che
  // si fidava di un confronto fra il pixel scritto e il pixel riletto subito
  // dopo. Al massimo della corsa — e mentre una scorsa per inerzia è ancora
  // viva — quei due numeri possono non coincidere: da lì la pista risultava
  // «mai posizionata», e ogni scorsa successiva veniva ingoiata e riportata
  // dov'era. Ai numeri di mezzo non si nota mai.
  //
  // Qui la pista è disposta fin dal montaggio, e la scrittura attacca *quasi*:
  // rilegge sette pixel più in là, come farebbe un aggancio ancora in corsa.
  const veri = ['scrollTop', 'scrollHeight', 'clientHeight'].map(
    (n) => [n, Object.getOwnPropertyDescriptor(Element.prototype, n)!] as const,
  );
  let finto = 0;
  Object.defineProperty(Element.prototype, 'scrollTop', {
    configurable: true,
    get: () => finto,
    set: (n: number) => {
      finto = n - 7;
    },
  });
  Object.defineProperty(Element.prototype, 'scrollHeight', { configurable: true, get: () => 1452 });
  Object.defineProperty(Element.prototype, 'clientHeight', { configurable: true, get: () => 252 });

  try {
    monta(MASSIMO);
    await giro();

    finto = PASSO * 12; // l'utente ha girato indietro
    pista().dispatchEvent(new Event('scroll'));
    await giro();

    expect(letto).toContain(12);
  } finally {
    for (const [nome, desc] of veri) Object.defineProperty(Element.prototype, nome, desc);
  }
});
