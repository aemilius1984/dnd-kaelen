import type { Modifica } from './modifiche';

/** Un oggetto trovato al tavolo. Non può vivere nei dati del repo: un forziere
 *  non si apre con una pull request, e `campiVersione` include
 *  `equipaggiamento` — toccare la quantità di una voce lì dentro azzera la
 *  sessione salvata. */
export interface OggettoAggiunto {
  /** `mio:<n>`. Il carattere `:` non può comparire in uno slug, che viene dal
   *  nome di un file: la collisione con gli id del repo è impossibile per
   *  costruzione, non per fortuna. Stessa ragione di `SPESA_MANUALE`. */
  id: string;
  nome: string;
  quantita: number;
  consumabile: boolean;
  nota?: string;
  /** Vuoto se non è magico, che è il caso normale. */
  modifiche: Modifica[];
}
