import { expect, it } from 'vitest';
import { raccogliPreparazioneDovuta, segnalaPreparazioneDovuta } from '@/lib/consegna-preparazione';

/** Un deposito finto: le prove non devono dipendere da un browser. */
const deposito = (): Storage => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
};

it('a freddo non c’è nessun obbligo di preparare', () => {
  expect(raccogliPreparazioneDovuta(deposito())).toBe(false);
});

it('il riposo lo segnala e l’archivio lo raccoglie', () => {
  const d = deposito();
  segnalaPreparazioneDovuta(d);

  expect(raccogliPreparazioneDovuta(d)).toBe(true);
});

it('si raccoglie una volta sola', () => {
  // Ricaricando `/preparati/` non deve riaprirsi una sessione già chiusa: il
  // manuale concede il cambio alla fine del riposo, non a ogni ricarica.
  const d = deposito();
  segnalaPreparazioneDovuta(d);
  raccogliPreparazioneDovuta(d);

  expect(raccogliPreparazioneDovuta(d)).toBe(false);
});
