import { describe, expect, it } from 'vitest';
import { caricaIncantesimi, caricaPersonaggioDaFile } from '@/lib/carica-personaggio';

const pg = caricaPersonaggioDaFile();
const magie = caricaIncantesimi();

describe('collezione degli incantesimi', () => {
  it('contiene ogni slug citato nella scheda', () => {
    const citati = [...pg.trucchetti, ...pg.preparatiIniziali, ...pg.dominio];
    for (const slug of citati) {
      expect(magie.has(slug), `manca ${slug}`).toBe(true);
    }
  });

  it('marca come dominio esattamente i quattro incantesimi del dominio', () => {
    const dominio = [...magie.values()].filter((m) => m.dominio).length;
    expect(dominio).toBe(4);
  });

  it('assegna livello 0 ai tre trucchetti', () => {
    for (const slug of pg.trucchetti) {
      expect(magie.get(slug)?.livello).toBe(0);
    }
  });

  it('descrive Frantumare con i suoi dati operativi', () => {
    const frantumare = magie.get('frantumare');
    expect(frantumare?.nomeEn).toBe('Shatter');
    expect(frantumare?.livello).toBe(2);
    expect(frantumare?.tiro).toBe('Cos');
    expect(frantumare?.danno).toBe('3d8 tuono');
  });
});
