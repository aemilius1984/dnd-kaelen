import type { Modifica } from './modifiche';
import type { Personaggio } from './schema';
import { aggiorna, impostaOggetto, type StatoSessione } from './sheet-state';

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

/** Vedi il commento su `OggettoAggiunto.id`. Stessa forma e stessa ragione di
 *  `SPESA_MANUALE`. */
export const PREFISSO_MIO = 'mio:';

/** Il prossimo id libero. Non riusa quelli liberati da una rimozione: `indossati`
 *  porta gli id e non gli oggetti, e un `mio:1` riciclato farebbe ricomparire
 *  indossato l'oggetto nuovo. */
export function prossimoIdOggetto(s: StatoSessione): string {
  const numeri = s.oggettiAggiunti.map((o) => Number(o.id.slice(PREFISSO_MIO.length)) || 0);
  return `${PREFISSO_MIO}${Math.max(0, ...numeri) + 1}`;
}

export function aggiungiOggetto(
  s: StatoSessione,
  dati: Omit<OggettoAggiunto, 'id'>,
): StatoSessione {
  const oggetto: OggettoAggiunto = {
    ...dati,
    id: prossimoIdOggetto(s),
    quantita: Math.max(0, dati.quantita),
  };
  return aggiorna(s, { oggettiAggiunti: [...s.oggettiAggiunti, oggetto] });
}

export function impostaQuantitaAggiunta(
  s: StatoSessione,
  id: string,
  quantita: number,
): StatoSessione {
  return aggiorna(s, {
    oggettiAggiunti: s.oggettiAggiunti.map((o) =>
      o.id === id ? { ...o, quantita: Math.max(0, quantita) } : o,
    ),
  });
}

export function rimuoviOggetto(s: StatoSessione, id: string): StatoSessione {
  return aggiorna(s, {
    oggettiAggiunti: s.oggettiAggiunti.filter((o) => o.id !== id),
    // Un indossato senza il suo oggetto è un id appeso nel vuoto, e i suoi
    // modificatori resterebbero addosso a Kaelen per sempre.
    indossati: s.indossati.filter((x) => x !== id),
  });
}

export function commutaIndossato(s: StatoSessione, id: string): StatoSessione {
  const dentro = s.indossati.includes(id);
  return aggiorna(s, {
    indossati: dentro ? s.indossati.filter((x) => x !== id) : [...s.indossati, id],
  });
}

/** Una riga dell'elenco che sale in scheda, da qualunque delle due sorgenti
 *  venga. `mio` non è decorazione: è il filetto ambra sul fianco della carta,
 *  lo stesso segno che distingue il dominio fra le carte incantesimo. */
export interface VoceConsumabile {
  id: string;
  nome: string;
  nomeEn?: string;
  nota?: string;
  quantita: number;
  mio: boolean;
}

/** I consumabili delle due sorgenti in un elenco solo, i dati prima.
 *  `consumabile` era una bandiera morta: ogni voce di `equipaggiamento` la
 *  portava, lo schema la validava, e nessuna interfaccia la leggeva. Il gancio
 *  era già pagato. */
export function consumabili(pg: Personaggio, s: StatoSessione): VoceConsumabile[] {
  return [
    ...pg.equipaggiamento
      .filter((e) => e.consumabile)
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        nomeEn: e.nomeEn,
        nota: e.note,
        quantita: s.oggetti[e.id] ?? 0,
        mio: false,
      })),
    ...s.oggettiAggiunti
      .filter((o) => o.consumabile)
      .map((o) => ({ id: o.id, nome: o.nome, nota: o.nota, quantita: o.quantita, mio: true })),
  ];
}

/** Una porta sola per spendere, qualunque sia la sorgente: la striscia Annulla
 *  non deve sapere se quel che è stato bevuto veniva dal manuale o dal forziere. */
export function consuma(s: StatoSessione, id: string): StatoSessione {
  if (id.startsWith(PREFISSO_MIO)) {
    const o = s.oggettiAggiunti.find((x) => x.id === id);
    return o ? impostaQuantitaAggiunta(s, id, o.quantita - 1) : s;
  }
  return impostaOggetto(s, id, (s.oggetti[id] ?? 0) - 1);
}

/** L'inverso esatto, per la striscia Annulla. */
export function restituisci(s: StatoSessione, id: string): StatoSessione {
  if (id.startsWith(PREFISSO_MIO)) {
    const o = s.oggettiAggiunti.find((x) => x.id === id);
    return o ? impostaQuantitaAggiunta(s, id, o.quantita + 1) : s;
  }
  return impostaOggetto(s, id, (s.oggetti[id] ?? 0) + 1);
}
