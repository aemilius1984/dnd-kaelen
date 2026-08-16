export type Tema = 'tempesta' | 'pergamena';

export const CHIAVE_TEMA = 'kaelen:tema';

export function temaValido(v: unknown): v is Tema {
  return v === 'tempesta' || v === 'pergamena';
}

/** Il valore salvato dall'utente vince sempre. In sua assenza — prima visita,
 *  storage negato, valore corrotto — si segue il sistema operativo.
 *  Questa stessa regola è ripetuta a mano nello script inline di
 *  BaseLayout: non è importabile lì, perché deve girare prima del primo
 *  rendering per evitare il lampeggio. Se cambia qui, cambia anche là. */
export function risolviTema(salvato: string | null, preferisceChiaro: boolean): Tema {
  if (temaValido(salvato)) return salvato;
  return preferisceChiaro ? 'pergamena' : 'tempesta';
}
