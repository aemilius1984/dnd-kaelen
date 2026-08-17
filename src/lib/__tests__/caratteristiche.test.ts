import { describe, expect, it } from 'vitest';
import { NOME_EN_CARATTERISTICA } from '@/lib/caratteristiche';

describe('nomi inglesi delle caratteristiche', () => {
  it('copre tutte e sei le caratteristiche', () => {
    expect(Object.keys(NOME_EN_CARATTERISTICA).sort()).toEqual([
      'car',
      'cos',
      'des',
      'for',
      'int',
      'sag',
    ]);
  });

  it('usa i nomi del manuale, non le sigle', () => {
    expect(NOME_EN_CARATTERISTICA.for).toBe('Strength');
    expect(NOME_EN_CARATTERISTICA.sag).toBe('Wisdom');
    expect(NOME_EN_CARATTERISTICA.car).toBe('Charisma');
  });
});
