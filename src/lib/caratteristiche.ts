import type { Caratteristica } from './schema';

/** Le sei caratteristiche sono un insieme chiuso e non cambiano mai: stanno in
 *  `lib` e non nei dati del personaggio, dove sarebbero sei righe ripetute
 *  identiche per ogni scheda futura. */
export const NOME_EN_CARATTERISTICA: Record<Caratteristica, string> = {
  for: 'Strength',
  des: 'Dexterity',
  cos: 'Constitution',
  int: 'Intelligence',
  sag: 'Wisdom',
  car: 'Charisma',
};
