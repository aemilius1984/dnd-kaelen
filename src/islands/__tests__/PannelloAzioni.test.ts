// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import PannelloAzioni from '@/islands/PannelloAzioni';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { applicaDanno, spendiSlot, statoIniziale, usaRisorsa } from '@/lib/sheet-state';
import { navigazione, raccogliPreparazioneDovuta } from '@/lib/consegna-preparazione';
import { muta, stato } from '@/lib/storage';

// Il pannello era il doppione di mezza scheda: danno, cura, PF temporanei,
// tiri contro morte, dadi vita e ispirazione stanno nella Vitalità, e slot e
// risorse si spendono dove sono scritti. Qui restano i due riposi — che non
// appartengono a nessuna sezione perché le toccano tutte — e le correzioni a
// mano, che sono il caso d'angolo.

const pg = caricaPersonaggioDaFile();

let radice: HTMLDivElement;

const giro = () => new Promise((r) => setTimeout(r, 0));

const bottoni = () => [...radice.querySelectorAll('button')];
const premi = (etichetta: string) => {
  const b = bottoni().find((x) => x.textContent?.trim() === etichetta);
  if (!b) throw new Error(`bottone non trovato: ${etichetta}`);
  b.click();
};
const testo = () => radice.textContent ?? '';

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>`;
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(PannelloAzioni, {}), radice);
  // Lo store è un modulo con stato: ogni test riparte da una sessione intatta.
  muta(() => statoIniziale(pg, 'v-test'));
  await giro();
});

afterEach(() => {
  render(null, radice);
});

describe('la potatura', () => {
  it('non ripete quel che ha già una casa altrove', async () => {
    // Ognuna di queste cose vive in un posto suo — la Vitalità, la modale di
    // lancio, le card delle capacità — e averla anche qui significava due
    // posti dove cambiare lo stesso numero.
    for (const sparito of [
      'PF temporanei',
      'Ispirazione',
      'Danno',
      'Cura',
      'TS morte',
      'Totale tirato al tavolo',
    ]) {
      expect(radice.innerHTML).not.toContain(sparito);
    }
  });

  it('le correzioni a mano partono chiuse', () => {
    // Si aprono quando qualcosa è andato storto, non a ogni turno: aperte
    // sarebbero di nuovo il modo normale di spendere.
    const dettagli = radice.querySelector('details')!;

    expect(dettagli.open).toBe(false);
    expect(dettagli.textContent).toContain('Correzioni a mano');
  });

  it('correggere a mano toglie e rimette, senza passare da «Usa»', async () => {
    premi('−');
    await giro();

    // Il primo «−» è quello degli slot di 1°: la spesa è manuale, senza un
    // incantesimo dietro.
    expect(stato.value.slotSpesi[1]).toHaveLength(1);

    premi('↺');
    await giro();
    expect(stato.value.slotSpesi[1]).toHaveLength(0);
  });
});

describe('i due riposi', () => {
  beforeEach(() => {
    vi.spyOn(navigazione, 'vai').mockImplementation(() => {});
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dicono cosa cambierebbe in questa sessione, non cosa dice il manuale', async () => {
    muta((x) => spendiSlot(applicaDanno(x, pg, 5), pg, 1, 'comando'));
    await giro();

    expect(testo()).toContain('PF 16 → 21');
    expect(testo()).toContain('1 slot');
  });

  it('a sessione intatta non si possono premere, e lo dicono', () => {
    // Un riposo che non recupera niente è un tocco che sembra fare qualcosa e
    // non fa nulla: al tavolo si crede di aver riposato.
    expect(testo()).toContain('Non c’è niente da recuperare.');
    const breve = bottoni().find((b) => b.textContent?.includes('Concludi riposo breve'))!;
    expect(breve.disabled).toBe(true);
  });

  it('chiedono conferma dentro il pannello, e si può cambiare idea', async () => {
    muta((x) => usaRisorsa(x, pg, 'incanalare', 'scintilla-divina'));
    await giro();

    premi('Concludi riposo breve');
    await giro();
    expect(testo()).toContain('Sì, riposa');
    // Niente `confirm()`: blocca il thread, non si può provare, e mostra il
    // testo del browser invece di quello della scheda.
    expect(stato.value.risorseUsate['incanalare']).toHaveLength(1);

    premi('Annulla');
    await giro();
    expect(testo()).not.toContain('Sì, riposa');
    expect(stato.value.risorseUsate['incanalare']).toHaveLength(1);
  });

  it('il riposo breve rende una carica, e non porta da nessuna parte', async () => {
    muta((x) => usaRisorsa(x, pg, 'incanalare', 'scintilla-divina'));
    await giro();
    premi('Concludi riposo breve');
    await giro();
    premi('Sì, riposa');
    await giro();

    expect(stato.value.risorseUsate['incanalare']).toHaveLength(0);
    expect(navigazione.vai).not.toHaveBeenCalled();
    expect(raccogliPreparazioneDovuta(sessionStorage)).toBe(false);
  });

  it('il riposo lungo compie il riposo prima di andarsene, e lascia detto perché', async () => {
    muta((x) => applicaDanno(x, pg, 5));
    await giro();
    premi('Concludi riposo lungo');
    await giro();
    premi('Sì, riposa');
    await giro();

    // Se la navigazione precedesse la mutazione, il riposo si perderebbe per
    // strada: i punti ferita devono essere già tornati quando si parte.
    expect(stato.value.pf).toBe(pg.pfMax);
    expect(navigazione.vai).toHaveBeenCalledWith('/preparati/');
    expect(raccogliPreparazioneDovuta(sessionStorage)).toBe(true);
  });
});
