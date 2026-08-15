import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';

describe('scheda di Kaelen', () => {
  const pg = caricaPersonaggioDaFile();

  it('valida lo schema del personaggio', () => {
    expect(pg.nome).toBe('Kaelen');
    expect(pg.livello).toBe(3);
  });

  it('contiene i punteggi di caratteristica grezzi', () => {
    expect(pg.caratteristiche).toEqual({ for: 16, des: 12, cos: 13, int: 10, sag: 16, car: 8 });
  });

  it('dichiara tre risorse con il loro recupero', () => {
    expect(pg.risorse.map((r) => r.id)).toEqual(['incanalare', 'ira-tempesta', 'tuono-tempesta']);
    expect(pg.risorse.find((r) => r.id === 'incanalare')?.recupero).toBe('breve');
  });

  it('dichiara sei incantesimi preparati iniziali e quattro del dominio', () => {
    expect(pg.preparatiIniziali).toHaveLength(6);
    expect(pg.dominio).toHaveLength(4);
    expect(pg.limitePreparati).toBe(6);
  });
});
