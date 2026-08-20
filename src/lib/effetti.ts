import type { Modifica } from './modifiche';
import { aggiorna, type StatoSessione } from './sheet-state';

/** Uno stato temporaneo addosso a Kaelen. Nasce da un lancio, da un incantesimo
 *  di qualcun altro, o da un'ampolla stappata dal nemico.
 *
 *  `modifiche` può essere **vuoto**: Benedizione dà un dado da tirare, e un
 *  dado non è un addendo — sta nella striscia col suo promemoria e non tocca
 *  nessun numero. Scudo della Fede è il contrario: nessun promemoria, una
 *  modifica sola, e la CA in pagina legge venti. */
export interface Effetto {
  id: string;
  nome: string;
  /** Lo slug dell'incantesimo, quando l'effetto nasce da un lancio. Serve a non
   *  accendere due Benedizioni: rilanciare rinnova, non accumula. */
  origine?: string;
  /** Un'etichetta, non un conto alla rovescia: «1 minuto». Un contatore di round
   *  richiede che qualcuno prema un bottone a ogni round di ogni combattimento,
   *  e la prima volta che ci si dimentica mente con l'aria di dire il vero.
   *  Un'etichetta non promette nulla, quindi non può mentire. */
  durata: string;
  concentrazione: boolean;
  /** Quel che non diventa un numero: «+1d4 ai tiri per colpire e ai TS». */
  promemoria?: string;
  modifiche: Modifica[];
  accesoIl: string;
}

let ultimo = 0;

/** Un id che non collide neanche accendendo due effetti nello stesso
 *  millisecondo. Il contatore basta da solo: gli id non escono dalla sessione,
 *  e non li legge nessun altro. */
export function nuovoIdEffetto(): string {
  return `eff:${Date.now()}-${++ultimo}`;
}

/** Chi si spegnerebbe accendendo questo. Si chiede **prima** di accendere,
 *  perché la concentrazione esclusiva applicata in silenzio è indistinguibile
 *  da un difetto: al tavolo si vedrebbe sparire una riga senza sapere perché. */
export function spentoDa(s: StatoSessione, nuovo: { concentrazione: boolean }): Effetto | null {
  if (!nuovo.concentrazione) return null;
  return s.effetti.find((e) => e.concentrazione) ?? null;
}

export function accendiEffetto(s: StatoSessione, nuovo: Effetto): StatoSessione {
  // Rilanciare lo stesso incantesimo rinnova la durata, non accende un secondo
  // Santuario. Gli effetti senza origine non si fondono: due dosi di veleno
  // restano due righe, perché nessuna delle due dice di essere l'altra.
  let effetti = nuovo.origine
    ? s.effetti.filter((e) => e.origine !== nuovo.origine)
    : [...s.effetti];
  if (nuovo.concentrazione) effetti = effetti.filter((e) => !e.concentrazione);
  return aggiorna(s, { effetti: [...effetti, nuovo] });
}

export function spegniEffetto(s: StatoSessione, id: string): StatoSessione {
  return aggiorna(s, { effetti: s.effetti.filter((e) => e.id !== id) });
}

/** Quel che fanno entrambi i riposi. Non è una semplificazione: un riposo breve
 *  dura un'ora, e l'effetto più lungo che Kaelen sa produrre ne dura dieci
 *  minuti. L'esaurimento non è qui dentro — ha un campo suo e altre regole. */
export function spegniTuttiGliEffetti(s: StatoSessione): StatoSessione {
  return aggiorna(s, { effetti: [] });
}

export function impostaEsaurimento(s: StatoSessione, livelli: number): StatoSessione {
  return aggiorna(s, { esaurimento: Math.min(6, Math.max(0, Math.trunc(livelli))) });
}
