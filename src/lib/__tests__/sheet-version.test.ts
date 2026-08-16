import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { campiVersione, hashDati } from '@/lib/sheet-version';

describe('hashDati', () => {
  it('è deterministico e sensibile al contenuto', () => {
    expect(hashDati('kaelen')).toBe(hashDati('kaelen'));
    expect(hashDati('kaelen')).not.toBe(hashDati('kaelen '));
  });
});

describe('campiVersione', () => {
  const pg = caricaPersonaggioDaFile();
  const pool = [{ slug: 'aiuto', nome: 'Aiuto', livello: 1, dominio: false }];

  it('ignora la prosa: correggere capacità, reazioni o interpretazione non cambia l’hash', () => {
    const base = hashDati(JSON.stringify(campiVersione(pg, pool)));
    const pgConProsaCorretta = {
      ...pg,
      capacita: pg.capacita.map((c) => ({ ...c, paragrafi: ['testo corretto, refuso sistemato'] })),
      reazioni: pg.reazioni.map((r) => ({ ...r, effetto: 'testo diverso' })),
      interpretazione: { ...pg.interpretazione, legame: 'un legame diverso' },
    };
    const dopo = hashDati(JSON.stringify(campiVersione(pgConProsaCorretta, pool)));
    expect(dopo).toBe(base);
  });

  it('cambia quando cambia un campo da cui lo stato di sessione dipende', () => {
    const base = hashDati(JSON.stringify(campiVersione(pg, pool)));
    expect(hashDati(JSON.stringify(campiVersione({ ...pg, pfMax: pg.pfMax + 1 }, pool)))).not.toBe(
      base,
    );
    expect(
      hashDati(
        JSON.stringify(
          campiVersione(pg, [
            ...pool,
            { slug: 'comando', nome: 'Comando', livello: 1, dominio: false },
          ]),
        ),
      ),
    ).not.toBe(base);
  });
});
