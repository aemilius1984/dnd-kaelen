import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { FONT } from '../font-elenco.mjs';

it('ogni woff2 dichiarato esiste davvero in node_modules', () => {
  // Un nome di file sbagliato non rompe la build: `prebuild` copia, la pagina
  // ricade sul serif di sistema e nessuno se ne accorge fino a guardarla.
  const mancanti = FONT.filter(
    ([pacchetto, nome]) => !existsSync(join('node_modules', pacchetto, 'files', nome)),
  );

  expect(mancanti).toEqual([]);
});

it('porta le tre famiglie nuove e ha lasciato Marcellus', () => {
  const nomi = FONT.map(([, n]) => n).join(' ');

  expect(nomi).toContain('fraunces');
  expect(nomi).toContain('inter');
  expect(nomi).toContain('jetbrains-mono');
  expect(nomi).toContain('eb-garamond');
  expect(nomi).not.toContain('marcellus');
});
