import { describe, expect, it } from 'vitest';
import { risolviTema, temaValido } from '@/lib/tema';

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
