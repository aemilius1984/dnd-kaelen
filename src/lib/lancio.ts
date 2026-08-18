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

/** Una carta si spegne quando non resta modo di lanciarla. Per un rituale quel
 *  momento non arriva mai: si lancia senza spendere slot, e restare a secco è
 *  esattamente la situazione in cui il rituale conta di più. Spegnerlo lì
 *  faceva sparire l'unica opzione rimasta. */
export function cartaSpenta(
  s: StatoSessione,
  pg: Personaggio,
  livelloIncantesimo: number,
  rituale: boolean,
): boolean {
  if (livelloIncantesimo === 0) return false;
  if (rituale) return false;
  return livelliLanciabili(s, pg, livelloIncantesimo).length === 0;
}
