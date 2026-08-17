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

  // La prosa non sta più solo fuori dagli oggetti versionati: da quando
  // `risorse` ha una `descrizione` ed `equipaggiamento` un `nomeEn`, versionare
  // gli oggetti interi rimetterebbe il refuso dentro l'hash.
  it('non azzera la sessione quando cambia solo prosa dentro risorse ed equipaggiamento', () => {
    const prima = campiVersione(pg, pool);
    const dopo = campiVersione(
      {
        ...pg,
        risorse: pg.risorse.map((r) => ({
          ...r,
          descrizione: 'testo riscritto',
          nomeEn: 'Renamed',
        })),
        equipaggiamento: pg.equipaggiamento.map((e) => ({ ...e, nomeEn: 'Renamed' })),
      },
      pool,
    );

    // La versione dipende da ciò da cui dipende lo *stato*: quanti usi ha una
    // risorsa, non come la descriviamo.
    expect(dopo).toEqual(prima);
  });

  it('cambia quando cambia il numero di usi di una risorsa o la quantità di un oggetto', () => {
    const base = hashDati(JSON.stringify(campiVersione(pg, pool)));
    const conUnUsoInPiu = {
      ...pg,
      risorse: pg.risorse.map((r) => (r.id === 'incanalare' ? { ...r, max: r.max + 1 } : r)),
    };
    const conUnaRazioneInPiu = {
      ...pg,
      equipaggiamento: pg.equipaggiamento.map((e) =>
        e.id === 'razioni' ? { ...e, quantita: e.quantita + 1 } : e,
      ),
    };

    expect(hashDati(JSON.stringify(campiVersione(conUnUsoInPiu, pool)))).not.toBe(base);
    expect(hashDati(JSON.stringify(campiVersione(conUnaRazioneInPiu, pool)))).not.toBe(base);
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
