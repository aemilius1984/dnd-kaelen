import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { cartaSpenta, livelliLanciabili } from '@/lib/lancio';
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
    for (let i = 0; i < 4; i++) s = spendiSlot(s, pg, 1, 'comando');
    expect(livelliLanciabili(s, pg, 1)).toEqual([2]);
  });

  it('non offre nulla quando tutti gli slot sono spesi', () => {
    let s = fresco();
    for (let i = 0; i < 4; i++) s = spendiSlot(s, pg, 1, 'comando');
    for (let i = 0; i < 2; i++) s = spendiSlot(s, pg, 2, 'frantumare');
    expect(livelliLanciabili(s, pg, 1)).toEqual([]);
  });
});

describe('quando una carta si spegne', () => {
  const pg = caricaPersonaggioDaFile();
  const vuoto = () => {
    let s = statoIniziale(pg, 'v');
    for (const x of pg.slot) for (let i = 0; i < x.max; i++) s = spendiSlot(s, pg, x.livello, 'x');
    return s;
  };

  it('a slot pieni nessuna carta è spenta', () => {
    expect(cartaSpenta(statoIniziale(pg, 'v'), pg, 1, false)).toBe(false);
  });

  it('finiti gli slot la carta normale si spegne', () => {
    expect(cartaSpenta(vuoto(), pg, 1, false)).toBe(true);
  });

  it('ma un rituale resta acceso proprio lì', () => {
    // È il momento in cui il rituale conta di più: senza slot è l'unico modo
    // rimasto di lanciarlo. Spegnerlo faceva sparire l'ultima opzione.
    expect(cartaSpenta(vuoto(), pg, 1, true)).toBe(false);
  });

  it('un trucchetto non si spegne mai: non spende niente', () => {
    expect(cartaSpenta(vuoto(), pg, 0, false)).toBe(false);
  });
});
