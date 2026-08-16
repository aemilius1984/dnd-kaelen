import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { livelliLanciabili } from '@/lib/lancio';
import { spendiSlot, statoIniziale } from '@/lib/sheet-state';

const pg = caricaPersonaggioDaFile();
const fresco = () => statoIniziale(pg, 'v-test');

describe('livelli con cui si può lanciare', () => {
  it('offre ogni slot di livello pari o superiore', () => {
    expect(livelliLanciabili(fresco(), pg, 1)).toEqual([1, 2]);
  });

  it('non offre slot di livello inferiore', () => {
    expect(livelliLanciabili(fresco(), pg, 2)).toEqual([2]);
  });

  it('non offre nulla per un trucchetto', () => {
    expect(livelliLanciabili(fresco(), pg, 0)).toEqual([]);
  });

  it('toglie i livelli esauriti', () => {
    let s = fresco();
    for (let i = 0; i < 4; i++) s = spendiSlot(s, pg, 1);
    expect(livelliLanciabili(s, pg, 1)).toEqual([2]);
  });

  it('non offre nulla quando tutti gli slot sono spesi', () => {
    let s = fresco();
    for (let i = 0; i < 4; i++) s = spendiSlot(s, pg, 1);
    for (let i = 0; i < 2; i++) s = spendiSlot(s, pg, 2);
    expect(livelliLanciabili(s, pg, 1)).toEqual([]);
  });
});
