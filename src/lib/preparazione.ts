import { signal } from '@preact/signals';
import type { Personaggio } from './schema';

/** La sessione di preparazione: la finestra in cui i sei preparati di Kaelen si
 *  possono cambiare, che il manuale apre solo alla fine di un Riposo Lungo.
 *
 *  La bozza vive **fuori** dallo stato canonico e non viene salvata: finché non
 *  si conferma, `StatoSessione.preparati` resta quello di prima. È la regola
 *  scritta nella spec regolamentare, e ha una ragione pratica — chiudere la
 *  pagina a metà scelta non deve lasciare una lista di cinque incantesimi in
 *  localStorage, che sarebbe uno stato che le regole non ammettono.
 *
 *  `null` significa «nessuna sessione aperta», ed è diverso da una lista vuota:
 *  è la differenza fra «non si tocca» e «stai scegliendo e non hai ancora
 *  scelto niente». */
export const bozza = signal<string[] | null>(null);

export function apri(preparati: string[]): void {
  // Copia: chi annulla non deve scoprire che l'originale era già stato toccato.
  bozza.value = [...preparati];
}

export function annulla(): void {
  bozza.value = null;
}

/** Aggiunge o toglie uno slug dalla bozza. Togliere è sempre concesso;
 *  aggiungere no, e i due divieti sono diversi: oltre il limite si è pieni,
 *  mentre dominio e trucchetti non ci vanno *mai* perché sono già preparati e
 *  stanno fuori dal conto dei sei. */
export function commuta(lista: string[], pg: Personaggio, slug: string): string[] {
  if (lista.includes(slug)) return lista.filter((x) => x !== slug);
  if (pg.dominio.includes(slug) || pg.trucchetti.includes(slug)) return lista;
  if (lista.length >= pg.limitePreparati) return lista;
  return [...lista, slug];
}

/** Alla conferma i preparati devono essere esattamente il limite: né cinque né
 *  sette. Durante la sessione si può stare sotto, perché per sostituire si
 *  toglie prima e si aggiunge dopo. */
export function completa(lista: string[], pg: Personaggio): boolean {
  return lista.length === pg.limitePreparati;
}
