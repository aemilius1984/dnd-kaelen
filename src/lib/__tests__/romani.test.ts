import { expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { romano } from '@/lib/romani';

it('copre tutti i livelli di slot che esistono', () => {
  // Nove, e non uno di più: oltre il nono livello gli slot non ci sono.
  expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map(romano)).toEqual([
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
  ]);
});

it('copre i livelli che Kaelen ha davvero', () => {
  const pg = caricaPersonaggioDaFile();

  for (const s of pg.slot) expect(() => romano(s.livello)).not.toThrow();
});

it('rifiuta un livello che non è un livello di slot', () => {
  // Rumorosa invece che silenziosa: un `undefined` finito in pagina si
  // leggerebbe come una fila senza nome, e nessuno saprebbe di che livello è.
  expect(() => romano(0)).toThrow(/fuori scala/);
  expect(() => romano(10)).toThrow(/fuori scala/);
});
