// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Fragment, h, render } from 'preact';
import Contatori from '@/islands/Contatori';
import StrisciaAnnulla from '@/islands/StrisciaAnnulla';
import { annullabile } from '@/lib/annulla';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { muta, stato } from '@/lib/storage';

// Le capacità si spendevano solo dal pannello ⚡, cioè da un elenco lontano
// dalla capacità stessa. Adesso si spendono dalla card, e il gesto è
// annullabile come un lancio.

const pg = caricaPersonaggioDaFile();

let radice: HTMLDivElement;

const giro = () => new Promise((r) => setTimeout(r, 50));

const caselle = (id: string) =>
  document.querySelector<HTMLElement>(`[data-caselle="${id}"] .caselle`)!;
const comandoReazione = (id: string) =>
  document.querySelector<HTMLButtonElement>(`[data-spendi="${id}"] button`);
const comandoUso = (id: string) =>
  document.querySelector<HTMLButtonElement>(`[data-uso="${id}"] button`);

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    // Il markup come lo scrive `CapacitaEReazioni.astro`, ridotto all'osso.
    `<div class="superficie capacita-card" data-capacita="incanalare">` +
    `<div data-caselle="incanalare"></div>` +
    `</div>` +
    `<div class="superficie capacita-card" data-capacita="ira-tempesta">` +
    `<div data-caselle="ira-tempesta"></div>` +
    `<div class="spendi" data-spendi="ira-tempesta"></div>` +
    `</div>` +
    `<dialog id="cap-incanalare">` +
    `<div class="spendi" data-uso="scintilla-divina" data-risorsa="incanalare"></div>` +
    `<div class="spendi" data-uso="ira-distruttiva" data-risorsa="incanalare"></div>` +
    `</dialog>`;
  const d = document.querySelector('dialog')!;
  Object.assign(d, { close: () => d.removeAttribute('open') });

  // Segnali di modulo: sopravvivono fra un test e l'altro.
  muta((x) => ({ ...x, risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, []])) }));
  annullabile.value = null;

  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Fragment, {}, h(Contatori, {}), h(StrisciaAnnulla, {})), radice);
  await giro();
});

afterEach(() => {
  render(null, radice);
});

describe('spendere una capacità dalla sua card', () => {
  it('la reazione si spende con un tocco, senza modale', async () => {
    comandoReazione('ira-tempesta')!.click();
    await giro();

    expect(stato.value.risorseUsate['ira-tempesta']).toEqual(['ira-tempesta']);
  });

  it('l’uso scelto nella modale è quello che finisce nella coda', async () => {
    comandoUso('ira-distruttiva')!.click();
    await giro();

    // Non «una carica di Incanalare»: *quale* carica. È la differenza fra una
    // casella grigia e una casella che dice cosa è successo.
    expect(stato.value.risorseUsate['incanalare']).toEqual(['ira-distruttiva']);
  });

  it('la casella consumata porta il sigillo dell’uso', async () => {
    comandoUso('scintilla-divina')!.click();
    await giro();

    expect(caselle('incanalare').innerHTML).toContain('#uso-scintilla-divina');
  });

  it('il gesto è annullabile, e annullarlo rimette la carica', async () => {
    comandoUso('scintilla-divina')!.click();
    await giro();
    expect(annullabile.value?.detto).toBe('Scintilla Divina');

    annullabile.value!.disfa();
    await giro();
    expect(stato.value.risorseUsate['incanalare']).toEqual([]);
  });

  it('a secco il comando non c’è più, e la card lo dice', async () => {
    // Due cariche: alla terza non c'è niente da spendere. Un bottone che non
    // fa niente è peggio di un bottone assente — al tavolo si preme e si
    // crede di aver speso.
    comandoUso('scintilla-divina')!.click();
    await giro();
    comandoUso('scintilla-divina')!.click();
    await giro();

    expect(comandoUso('scintilla-divina')).toBeNull();
    expect(
      document.querySelector('[data-capacita="incanalare"]')!.classList.contains('spenta'),
    ).toBe(true);
  });
});
