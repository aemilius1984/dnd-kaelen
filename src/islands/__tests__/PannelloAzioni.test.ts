// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import PannelloAzioni from '@/islands/PannelloAzioni';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { impostaPfTemporanei } from '@/lib/sheet-state';
import { navigazione, raccogliPreparazioneDovuta } from '@/lib/consegna-preparazione';
import { muta, stato } from '@/lib/storage';

// Due campi numerici del pannello si comportavano male sotto le dita:
// quello dei PF temporanei era controllato sullo stato salvato e lo
// riscriveva a ogni battuta, quindi cancellarlo faceva ricomparire lo zero
// prima ancora di poter digitare; quello dei dadi vita si apriva a 0 con
// `min="1"` addosso, cioè `:invalid` a ogni apertura del pannello.

const pg = caricaPersonaggioDaFile();

let radice: HTMLDivElement;

/** Preact accoda i rendering: si aspetta il giro successivo. */
const giro = () => new Promise((r) => setTimeout(r, 0));

function digita(campo: HTMLInputElement, testo: string) {
  campo.value = testo;
  campo.dispatchEvent(new Event('input', { bubbles: true }));
}

const campoPfTemporanei = () => radice.querySelector<HTMLInputElement>('label.riga input')!;
const campoDadiVita = () =>
  radice.querySelector<HTMLInputElement>('input[aria-label="Totale tirato al tavolo"]')!;

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>`;
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(PannelloAzioni, {}), radice);
  // Lo store è un modulo con stato: si riparte sempre da zero PF temporanei.
  muta((x) => impostaPfTemporanei(x, 0));
  await giro();
});

afterEach(() => {
  render(null, radice);
});

describe('campo dei PF temporanei', () => {
  it('scrive nello stato quello che si digita', async () => {
    digita(campoPfTemporanei(), '7');
    await giro();

    expect(stato.value.pfTemporanei).toBe(7);
    expect(campoPfTemporanei().value).toBe('7');
  });

  it('si lascia svuotare senza far ricomparire il numero', async () => {
    digita(campoPfTemporanei(), '7');
    await giro();

    digita(campoPfTemporanei(), '');
    await giro();

    // Prima il campo tornava a "0" nello stesso istante e per ridigitare
    // serviva un seleziona-tutto.
    expect(campoPfTemporanei().value).toBe('');
    // Un campo vuoto non è "zero PF temporanei": è una cifra a metà. Lo
    // stato non si tocca finché non arriva un numero.
    expect(stato.value.pfTemporanei).toBe(7);
  });

  it('riparte dal vuoto con il numero nuovo', async () => {
    digita(campoPfTemporanei(), '7');
    await giro();
    digita(campoPfTemporanei(), '');
    await giro();
    digita(campoPfTemporanei(), '5');
    await giro();

    expect(stato.value.pfTemporanei).toBe(5);
    expect(campoPfTemporanei().value).toBe('5');
  });

  it('rimette il valore salvato quando si esce da un campo lasciato vuoto', async () => {
    digita(campoPfTemporanei(), '7');
    await giro();
    digita(campoPfTemporanei(), '');
    await giro();

    campoPfTemporanei().dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    await giro();

    expect(campoPfTemporanei().value).toBe('7');
    expect(stato.value.pfTemporanei).toBe(7);
  });

  it('torna a mostrare lo stato quando a cambiarlo è un altro comando', async () => {
    digita(campoPfTemporanei(), '7');
    await giro();

    muta((x) => impostaPfTemporanei(x, 2));
    await giro();

    expect(campoPfTemporanei().value).toBe('2');
  });
});

describe('campo dei dadi vita', () => {
  it('si apre su un valore che rispetta il proprio minimo', () => {
    const campo = campoDadiVita();

    expect(campo.getAttribute('min')).toBe('1');
    expect(campo.value).toBe('1');
    expect(Number(campo.value)).toBeGreaterThanOrEqual(Number(campo.getAttribute('min')));
  });

  it('si lascia svuotare per ridigitare, senza cadere sotto il minimo', async () => {
    const campo = campoDadiVita();
    digita(campo, '');
    await giro();

    // Vuoto è vuoto: non è lo zero che `min="1"` rifiuta.
    expect(campo.value).toBe('');

    digita(campo, '6');
    await giro();
    expect(campo.value).toBe('6');
  });
});

describe('il passaggio all’archivio dopo il riposo lungo', () => {
  // Cambiare i preparati è dovuto alla fine di un Riposo Lungo: il momento in
  // cui il giocatore deve decidere è quello, non dieci minuti dopo quando se
  // lo ricorda.
  //
  // L'archivio non è più un dialogo su questa pagina: ha una sede sola,
  // `/preparati/`. Fra le due c'è una navigazione, e la bozza è un signal di
  // modulo che una navigazione azzera — quindi il pannello lascia detto che la
  // preparazione è dovuta, e la sessione la apre l'archivio quando arriva.
  let andati: string[];

  beforeEach(() => {
    andati = [];
    // jsdom non implementa né `confirm` né la navigazione.
    vi.stubGlobal('confirm', () => true);
    vi.spyOn(navigazione, 'vai').mockImplementation((u) => {
      andati.push(u);
    });
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const premi = (etichetta: string) => {
    const b = [...radice.querySelectorAll('button')].find((x) =>
      x.textContent?.includes(etichetta),
    );
    b!.click();
  };

  it('il riposo lungo porta all’archivio, e lascia detto perché', async () => {
    premi('Riposo lungo');
    await giro();

    expect(andati).toEqual(['/preparati/']);
    expect(raccogliPreparazioneDovuta(sessionStorage)).toBe(true);
  });

  it('il riposo breve no: i preparati non si toccano', async () => {
    premi('Concludi riposo breve');
    await giro();

    expect(andati).toEqual([]);
    expect(raccogliPreparazioneDovuta(sessionStorage)).toBe(false);
  });

  it('il riposo si compie prima di andarsene', async () => {
    // Se la navigazione precedesse la mutazione, il riposo si perderebbe per
    // strada: i punti ferita devono essere già tornati quando si parte.
    premi('Riposo lungo');
    await giro();

    expect(stato.value.pf).toBe(pg.pfMax);
  });
});
