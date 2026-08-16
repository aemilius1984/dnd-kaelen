import type { Personaggio } from './schema';
import { puoSpendereSlot, type StatoSessione } from './sheet-state';

/** Un incantesimo si lancia con uno slot del suo livello o superiore. I
 *  trucchetti non consumano nulla, quindi non offrono alcun livello. */
export function livelliLanciabili(
  s: StatoSessione,
  pg: Personaggio,
  livelloIncantesimo: number,
): number[] {
  if (livelloIncantesimo === 0) return [];
  return pg.slot
    .filter((x) => x.livello >= livelloIncantesimo && puoSpendereSlot(s, pg, x.livello))
    .map((x) => x.livello)
    .sort((a, b) => a - b);
}
