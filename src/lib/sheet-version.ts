import type { Personaggio } from './schema';

type CampiDaCuiDipendeLoStato = Pick<
  Personaggio,
  | 'pfMax'
  | 'numeroDadiVita'
  | 'slot'
  | 'risorse'
  | 'equipaggiamento'
  | 'monete'
  | 'limitePreparati'
  | 'trucchetti'
  | 'preparatiIniziali'
  | 'dominio'
>;

/** Solo i campi da cui `StatoSessione` dipende davvero: PF massimi, dadi vita,
 *  slot, risorse, equipaggiamento, monete, limite di preparati e i tre elenchi
 *  di incantesimi, più il pool da cui si può pescare. Volutamente esclude prosa
 *  come `capacita`, `reazioni` e `interpretazione`: correggere un refuso lì non
 *  deve azzerare la sessione salvata del giocatore (vedi Fix 3 del rapporto). */
export function campiVersione(
  pg: CampiDaCuiDipendeLoStato,
  pool: unknown,
): Record<string, unknown> {
  return {
    pfMax: pg.pfMax,
    numeroDadiVita: pg.numeroDadiVita,
    slot: pg.slot,
    risorse: pg.risorse,
    equipaggiamento: pg.equipaggiamento,
    monete: pg.monete,
    limitePreparati: pg.limitePreparati,
    trucchetti: pg.trucchetti,
    preparatiIniziali: pg.preparatiIniziali,
    dominio: pg.dominio,
    pool,
  };
}

/** FNV-1a a 32 bit: deterministico, senza dipendenze, sufficiente per accorgersi
 *  che i dati della scheda sono cambiati fra una build e l'altra. */
export function hashDati(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
