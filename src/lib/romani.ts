/** I livelli di incantesimo in numeri romani.
 *
 *  Nove valori e nessuna aritmetica: oltre il nono livello gli slot non
 *  esistono, e un convertitore generale sarebbe codice che nessuno chiama con
 *  un numero che questa scheda possa produrre. */
const ROMANI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const;

export function romano(livello: number): string {
  const r = ROMANI[livello - 1];
  if (r === undefined) {
    throw new Error(`Livello fuori scala per un numero romano: ${livello}`);
  }
  return r;
}
