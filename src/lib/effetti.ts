import type { Modifica } from './modifiche';

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
