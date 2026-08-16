// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { applicaDanno } from '@/lib/sheet-state';

const pg = caricaPersonaggioDaFile();

function montaDati(sheetVersion = 'v-test') {
  document.body.innerHTML = `<script type="application/json" id="dati-iniziali">${JSON.stringify({
    pg,
    sheetVersion,
    pool: [],
  })}</script>`;
}

describe('store del browser', () => {
  beforeEach(() => {
    localStorage.clear();
    montaDati();
    // il modulo tiene stato interno: va reimportato pulito a ogni test
    vi.resetModules();
  });

  it('inizializza dallo stato iniziale quando localStorage è vuoto', async () => {
    const { assicuraInizializzato, stato } = await import('@/lib/storage');
    assicuraInizializzato();
    expect(stato.value.pf).toBe(21);
  });

  it('persiste le mutazioni', async () => {
    const { assicuraInizializzato, muta, stato, CHIAVE } = await import('@/lib/storage');
    assicuraInizializzato();
    muta((s) => applicaDanno(s, 4));
    expect(stato.value.pf).toBe(17);
    expect(JSON.parse(localStorage.getItem(CHIAVE)!).pf).toBe(17);
  });

  it("segnala l'azzeramento quando cambia la versione della scheda", async () => {
    const primo = await import('@/lib/storage');
    primo.assicuraInizializzato();
    primo.muta((s) => applicaDanno(s, 4));
    vi.resetModules();
    montaDati('v-nuova');
    const secondo = await import('@/lib/storage');
    secondo.assicuraInizializzato();
    expect(secondo.stato.value.pf).toBe(21);
    expect(secondo.avvisoAzzeramento.value).toBe(true);
  });
});

import { azzeraSessione, CHIAVE } from '@/lib/storage';

describe('azzeramento della sessione', () => {
  it('rimuove la chiave di stato senza toccare le preferenze', () => {
    localStorage.setItem(CHIAVE, '{"pf":3}');
    localStorage.setItem('kaelen:tema', 'pergamena');
    const ricarica = vi.fn();
    azzeraSessione(ricarica);
    expect(localStorage.getItem(CHIAVE)).toBeNull();
    expect(localStorage.getItem('kaelen:tema')).toBe('pergamena');
    expect(ricarica).toHaveBeenCalledOnce();
  });
});
