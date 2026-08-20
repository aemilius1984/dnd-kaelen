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

const cariche = (id: string) => document.querySelector<HTMLElement>(`[data-cariche="${id}"]`)!;
const usa = (id: string) =>
  document.querySelector<HTMLButtonElement>(`[data-consuma="${id}"] button`);

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    `<div class="superficie consumabile-card"><div data-cariche="acqua-santa"></div>` +
    `<div class="spendi" data-consuma="acqua-santa"></div></div>` +
    `<div class="superficie consumabile-card"><div data-cariche="razioni"></div>` +
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

    const carta = document.querySelector('[data-consumabili-miei] .consumabile-card')!;
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

  it('quattro campi visibili e i modificatori dietro una riga chiusa', () => {
    for (const nome of ['nome', 'quantita', 'consumabile', 'nota']) {
      expect(document.querySelector(`[data-modulo-oggetto] [name="${nome}"]`)).not.toBeNull();
    }
    const dettagli = document.querySelector<HTMLDetailsElement>('[data-modulo-oggetto] details')!;
    expect(dettagli.open).toBe(false);
    expect(dettagli.querySelector('summary')!.textContent).toContain('magico');
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
