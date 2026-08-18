/** La rotella dei numeri: si gira col dito e si ferma su una cifra.
 *
 *  Il movimento non è scritto da nessuna parte. Un contenitore che scorre con
 *  `scroll-snap-type: y mandatory` e una cifra per aggancio *è* una rotella:
 *  inerzia, rimbalzo e frenata li mette il browser, ed è la stessa fisica del
 *  selettore di data di iOS. Qui c'è solo la conversione fra la posizione di
 *  scorrimento e il numero sotto la banda di scelta — e siccome è aritmetica
 *  pura, si prova con vitest invece che con un browser, che questo progetto
 *  non ha. */

/** Altezza di una cifra, in px. Deve combaciare con l'altezza dichiarata nel
 *  CSS della pista: se le due divergono, la rotella si ferma fra due cifre. */
export const PASSO = 40;

export const MINIMO = 0;

/** Oltre trenta la rotella diventerebbe una corsa lunga: da lì in su si usa il
 *  campo «digita», che è comunque la strada da tastiera. */
export const MASSIMO = 30;

function guardia(passo: number): void {
  if (!(passo > 0)) {
    throw new Error(`Il passo di una rotella deve essere positivo, ricevuto ${passo}`);
  }
}

function limita(n: number, minimo: number, massimo: number): number {
  return Math.min(massimo, Math.max(minimo, n));
}

/** Il numero che sta sotto la banda di scelta a questa posizione. */
export function valoreDaScorrimento(
  scrollTop: number,
  passo: number,
  minimo: number,
  massimo: number,
): number {
  guardia(passo);
  return limita(minimo + Math.round(scrollTop / passo), minimo, massimo);
}

/** Dove va portata la pista perché quel numero finisca sotto la banda. */
export function scorrimentoDaValore(
  valore: number,
  passo: number,
  minimo: number,
  massimo: number,
): number {
  guardia(passo);
  return (limita(valore, minimo, massimo) - minimo) * passo;
}
