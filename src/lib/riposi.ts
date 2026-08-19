import type { Personaggio } from './schema';
import type { StatoSessione } from './sheet-state';
import { testoRecupero } from './capacita';

/** Cosa succede a premere, detto prima di premere.
 *
 *  Il riposo lungo era protetto da un `confirm()` che elencava le conseguenze
 *  in astratto — «PF al massimo, tutti i dadi vita recuperati» — cioè
 *  ripeteva il manuale invece di dire cosa cambia in *questa* sessione. Un
 *  giocatore a PF pieni e con tutti gli slot leggeva lo stesso avviso di uno
 *  ridotto a tre PF.
 *
 *  Funzione pura, e in `lib` per la ragione di sempre: un valore derivato non
 *  si scrive dentro il markup. */
/** «1 dadi vita» è il genere di sciatteria che si nota al primo colpo d'occhio
 *  e che nessun test coglierebbe da solo. */
function quanti(n: number, uno: string, molti: string): string {
  return `${n} ${n === 1 ? uno : molti}`;
}

export function conseguenzaRiposo(
  s: StatoSessione,
  pg: Personaggio,
  tipo: 'breve' | 'lungo',
): string[] {
  if (tipo === 'lungo') {
    const righe: string[] = [];
    if (s.pf < pg.pfMax) righe.push(`PF ${s.pf} → ${pg.pfMax}`);
    const slot = Object.values(s.slotSpesi).reduce((a, x) => a + x.length, 0);
    if (slot > 0) righe.push(quanti(slot, 'slot', 'slot'));
    if (s.dadiVitaSpesi > 0) righe.push(quanti(s.dadiVitaSpesi, 'dado vita', 'dadi vita'));
    const cariche = pg.risorse.reduce((a, r) => a + (s.risorseUsate[r.id] ?? []).length, 0);
    if (cariche > 0) righe.push(quanti(cariche, 'carica', 'cariche'));
    return righe;
  }

  // Il Riposo Breve rende una carica per risorsa, non tutte: dirlo per
  // risorsa e non in totale, perché con due risorse a recupero breve «2
  // cariche» si legge come «due della stessa».
  return pg.risorse
    .filter((r) => r.recupero === 'breve' && (s.risorseUsate[r.id] ?? []).length > 0)
    .map((r) => {
      const usate = (s.risorseUsate[r.id] ?? []).length;
      return `${r.nome} ${r.max - usate}/${r.max} → ${r.max - usate + 1}/${r.max}`;
    });
}

/** Il riposo che non cambierebbe niente. Non si nasconde il comando — si dice
 *  che non c'è niente da recuperare, altrimenti al tavolo si preme e si crede
 *  di aver riposato. */
export function riposoInutile(s: StatoSessione, pg: Personaggio, tipo: 'breve' | 'lungo'): boolean {
  return conseguenzaRiposo(s, pg, tipo).length === 0;
}

/** Il promemoria che accompagna il recupero: «tutte / Riposo Lungo» e simili
 *  vivono già in `capacita.ts`, e riusarlo evita due modi di dire la stessa
 *  cosa a due schermate di distanza. */
export { testoRecupero };
