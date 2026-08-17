import { describe, expect, it } from 'vitest';
import { COLORE_TEMA, risolviTema, temaValido } from '@/lib/tema';

describe('risoluzione del tema', () => {
  it('riconosce solo i due temi ammessi', () => {
    expect(temaValido('tempesta')).toBe(true);
    expect(temaValido('pergamena')).toBe(true);
    expect(temaValido('scuro')).toBe(false);
    expect(temaValido(null)).toBe(false);
    expect(temaValido(3)).toBe(false);
  });

  it('preferisce il valore salvato al sistema', () => {
    expect(risolviTema('pergamena', false)).toBe('pergamena');
    expect(risolviTema('tempesta', true)).toBe('tempesta');
  });

  it('ricade sul sistema quando non c è nulla di salvato', () => {
    expect(risolviTema(null, true)).toBe('pergamena');
    expect(risolviTema(null, false)).toBe('tempesta');
  });

  it('tratta un valore corrotto come assente', () => {
    expect(risolviTema('{}', true)).toBe('pergamena');
    expect(risolviTema('', false)).toBe('tempesta');
  });
});

describe('colore della cromatura del browser', () => {
  it('dà a ogni tema il proprio fondo', () => {
    // Gli stessi due valori sono ripetuti a mano nello script inline di
    // BaseLayout: se cambiano qui va cambiato anche là.
    expect(COLORE_TEMA.tempesta).toBe('#0a0c10');
    expect(COLORE_TEMA.pergamena).toBe('#efe7d6');
  });
});
