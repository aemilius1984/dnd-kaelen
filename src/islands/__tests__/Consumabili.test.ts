// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Fragment, h, render } from 'preact';
import Consumabili from '@/islands/Consumabili';
import StrisciaAnnulla from '@/islands/StrisciaAnnulla';
import { annullabile } from '@/lib/annulla';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { muta, stato } from '@/lib/storage';

const pg = caricaPersonaggioDaFile();
let radice: HTMLDivElement;
const giro = () => new Promise((r) => setTimeout(r, 50));

/** Accende «È un oggetto magico?». I campi del modificatore esistono solo da
 *  acceso: è l'ultima delle due domande sì/no. */
const magico = async () => {
  const domande = [
    ...document.querySelectorAll<HTMLInputElement>('[data-modulo-oggetto] .domanda input'),
  ];
  domande.at(-1)!.click();
  await giro();
};

const cariche = (id: string) => document.querySelector<HTMLElement>(`[data-cariche="${id}"]`)!;
const usa = (id: string) =>
  document.querySelector<HTMLButtonElement>(`[data-consuma="${id}"] button`);

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    `<div class="consumabile"><div data-cariche="acqua-santa"></div>` +
    `<div class="spendi" data-consuma="acqua-santa"></div></div>` +
    `<div class="consumabile"><div data-cariche="razioni"></div>` +
    `<div class="spendi" data-consuma="razioni"></div></div>` +
    `<div data-consumabili-miei></div>` +
    `<dialog id="aggiungi-oggetto"><div data-modulo-oggetto></div></dialog>`;
  const d = document.querySelector('dialog')!;
  Object.assign(d, {
    showModal: () => d.setAttribute('open', ''),
    close: () => d.removeAttribute('open'),
  });

  muta((x) => ({
    ...x,
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    oggettiAggiunti: [],
    indossati: [],
  }));
  annullabile.value = null;

  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Fragment, {}, h(Consumabili, {}), h(StrisciaAnnulla, {})), radice);
  await giro();
});

afterEach(() => render(null, radice));

describe('le cariche si leggono senza contare', () => {
  it('fino a cinque sono caselle', () => {
    expect(cariche('acqua-santa').querySelectorAll('.casella')).toHaveLength(1);
  });

  it('oltre le cinque è un numero', () => {
    // Sette quadratini per le razioni sono un conto che nessuno legge a colpo
    // d'occhio, e le razioni non si spendono in combattimento.
    expect(cariche('razioni').querySelectorAll('.casella')).toHaveLength(0);
    expect(cariche('razioni').textContent).toContain('7');
  });

  it('scendendo sotto le cinque tornano le caselle', async () => {
    muta((x) => ({ ...x, oggetti: { ...x.oggetti, razioni: 3 } }));
    await giro();
    expect(cariche('razioni').querySelectorAll('.casella')).toHaveLength(3);
  });
});

describe('spendere', () => {
  it('un tocco consuma', async () => {
    usa('acqua-santa')!.click();
    await giro();
    expect(stato.value.oggetti['acqua-santa']).toBe(0);
  });

  it('passa dalla striscia Annulla, come una carica', async () => {
    usa('razioni')!.click();
    await giro();
    expect(annullabile.value?.detto).toContain('Razioni');
    annullabile.value!.disfa();
    await giro();
    expect(stato.value.oggetti['razioni']).toBe(7);
  });

  it('a zero il comando non c’è', async () => {
    usa('acqua-santa')!.click();
    await giro();
    // Un bottone che non fa niente è peggio di un bottone assente: al tavolo
    // si preme e si crede di aver speso.
    expect(usa('acqua-santa')).toBeNull();
  });
});

describe('gli oggetti aggiunti a mano', () => {
  it('compaiono fra i consumabili, col filetto ambra', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        {
          id: 'mio:1',
          nome: 'Pozione di guarigione',
          quantita: 2,
          consumabile: true,
          modifiche: [],
        },
      ],
    }));
    await giro();

    const carta = document.querySelector('[data-consumabili-miei] .consumabile')!;
    expect(carta.textContent).toContain('Pozione di guarigione');
    expect(carta.classList.contains('mio')).toBe(true);
  });

  it('quelli non consumabili restano fuori dalla scheda', async () => {
    // La corda da cinquanta piedi non ha niente da fare qui.
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Cintura di Forza', quantita: 1, consumabile: false, modifiche: [] },
      ],
    }));
    await giro();
    expect(document.querySelector('[data-consumabili-miei]')!.textContent).not.toContain('Cintura');
  });

  it('si consumano come gli altri', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Pozione', quantita: 2, consumabile: true, modifiche: [] },
      ],
    }));
    await giro();
    usa('mio:1')!.click();
    await giro();
    expect(stato.value.oggettiAggiunti[0].quantita).toBe(1);
  });
});

describe('il modulo per aggiungerne', () => {
  const scrivi = (nome: string, valore: string) => {
    const campo = document.querySelector<HTMLInputElement>(
      `[data-modulo-oggetto] [name="${nome}"]`,
    )!;
    campo.value = valore;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('quattro campi visibili, e i modificatori solo se l’oggetto è magico', () => {
    for (const nome of ['nome', 'quantita', 'consumabile', 'nota']) {
      expect(document.querySelector(`[data-modulo-oggetto] [name="${nome}"]`)).not.toBeNull();
    }
    // Le due domande sì/no hanno la stessa forma: due interruttori, non una
    // casella e una riga di `<summary>` che nessuno capiva di poter premere.
    const domande = [...document.querySelectorAll('[data-modulo-oggetto] .domanda')];
    expect(domande.map((d) => d.textContent)).toEqual([
      'Si consuma usandolo',
      'È un oggetto magico?',
    ]);
    expect(domande.every((d) => d.querySelector('input.interruttore'))).toBe(true);
    // A interruttore spento i campi non esistono: `FormData` non li trova, e un
    // oggetto dichiarato magico e poi ripensato non porta con sé una modifica.
    expect(document.querySelector('[data-modulo-oggetto] [name="bersaglio"]')).toBeNull();
  });

  it('salva l’oggetto con un id suo', async () => {
    scrivi('nome', 'Pozione di guarigione');
    scrivi('quantita', '2');
    const consumabile = document.querySelector<HTMLInputElement>(
      '[data-modulo-oggetto] [name="consumabile"]',
    )!;
    consumabile.checked = true;
    consumabile.dispatchEvent(new Event('change', { bubbles: true }));

    document
      .querySelector<HTMLFormElement>('[data-modulo-oggetto] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();

    expect(stato.value.oggettiAggiunti).toHaveLength(1);
    expect(stato.value.oggettiAggiunti[0]).toMatchObject({
      id: 'mio:1',
      nome: 'Pozione di guarigione',
      quantita: 2,
      consumabile: true,
    });
  });

  it('senza nome non salva niente', async () => {
    document
      .querySelector<HTMLFormElement>('[data-modulo-oggetto] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();
    expect(stato.value.oggettiAggiunti).toEqual([]);
  });

  it('un oggetto magico porta la sua modifica', async () => {
    scrivi('nome', 'Scudo +1');
    scrivi('quantita', '1');
    await magico();
    const bersaglio = document.querySelector<HTMLSelectElement>(
      '[data-modulo-oggetto] [name="bersaglio"]',
    )!;
    bersaglio.value = 'ca';
    bersaglio.dispatchEvent(new Event('change', { bubbles: true }));
    scrivi('valore', '1');

    document
      .querySelector<HTMLFormElement>('[data-modulo-oggetto] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();

    expect(stato.value.oggettiAggiunti[0].modifiche).toEqual([
      { genere: 'voce', bersaglio: 'ca', valore: 1 },
    ]);
  });
});

describe('quel che il modulo dice prima di salvare', () => {
  const scrivi = (nome: string, valore: string) => {
    const campo = document.querySelector<HTMLInputElement>(
      `[data-modulo-oggetto] [name="${nome}"]`,
    )!;
    campo.value = valore;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const scegli = async (v: string) => {
    await magico();
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-modulo-oggetto] [name="bersaglio"]',
    )!;
    sel.value = v;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await giro();
  };
  const invia = () =>
    document
      .querySelector<HTMLFormElement>('[data-modulo-oggetto] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  it('scegliendo una caratteristica scrive quanto vale adesso', async () => {
    // «SAG diventa» è assoluto, ed è la regola giusta. Ma senza il punteggio
    // attuale accanto, al tavolo si scrive il bonus e non succede niente.
    await scegli('sag');
    await giro();
    expect(document.querySelector('[data-modulo-oggetto] .attuale')!.textContent).toBe(
      `ora ${pg.caratteristiche.sag}`,
    );
  });

  it('avverte quando il punteggio dichiarato è più basso del vero', async () => {
    await scegli('sag');
    scrivi('valore', '2');
    await giro();
    const avviso = document.querySelector('[data-modulo-oggetto] .avviso-inutile')!;
    expect(avviso.textContent).toContain('vince il più alto');
  });

  it('su una voce finale non dice niente: lì il valore è un addendo', async () => {
    await scegli('ca');
    scrivi('valore', '1');
    await giro();
    expect(document.querySelector('[data-modulo-oggetto] .attuale')).toBeNull();
    expect(document.querySelector('[data-modulo-oggetto] .avviso-inutile')).toBeNull();
  });

  it('un oggetto che sposta un numero nasce addosso', async () => {
    scrivi('nome', 'Anello di protezione');
    await scegli('ca');
    scrivi('valore', '1');
    invia();
    await giro();
    expect(stato.value.indossati).toEqual(['mio:1']);
  });

  it('una corda no', async () => {
    scrivi('nome', 'Corda marcia');
    invia();
    await giro();
    expect(stato.value.oggettiAggiunti).toHaveLength(1);
    expect(stato.value.indossati).toEqual([]);
  });
});

describe('quel che hai scritto resta scritto', () => {
  // Preact riapplica un `value` scritto nell'attributo a ogni ridisegno, e il
  // modulo si ridisegna a ogni interruttore toccato: la quantità tornava a uno
  // e il modificatore a zero, in silenzio, dopo che li avevi già compilati.
  it('la quantità sopravvive a un interruttore acceso dopo', async () => {
    const campo = document.querySelector<HTMLInputElement>(
      '[data-modulo-oggetto] [name="quantita"]',
    )!;
    campo.value = '3';
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    await magico();
    expect(
      document.querySelector<HTMLInputElement>('[data-modulo-oggetto] [name="quantita"]')!.value,
    ).toBe('3');
  });

  it('il valore del modificatore sopravvive alla scelta del bersaglio', async () => {
    await magico();
    const valore = document.querySelector<HTMLInputElement>(
      '[data-modulo-oggetto] [name="valore"]',
    )!;
    valore.value = '5';
    valore.dispatchEvent(new Event('input', { bubbles: true }));
    const sel = document.querySelector<HTMLSelectElement>(
      '[data-modulo-oggetto] [name="bersaglio"]',
    )!;
    sel.value = 'ca';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await giro();
    expect(
      document.querySelector<HTMLInputElement>('[data-modulo-oggetto] [name="valore"]')!.value,
    ).toBe('5');
  });
});
