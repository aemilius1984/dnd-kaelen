export type Tema = 'tempesta' | 'pergamena';

export const CHIAVE_TEMA = 'kaelen:tema';

export function temaValido(v: unknown): v is Tema {
  return v === 'tempesta' || v === 'pergamena';
}

/** Il valore salvato dall'utente vince sempre. In sua assenza — prima visita,
 *  storage negato, valore corrotto — si segue il sistema operativo.
 *  Il tema attivo è scritto su `<html>` in build da BaseLayout: questo
 *  modulo non è in uso oggi, resta per quando nascerà un secondo tema (il
 *  grafite — vedi BACKLOG.md) e servirà di nuovo scegliere fra loro a runtime. */
export function risolviTema(salvato: string | null, preferisceChiaro: boolean): Tema {
  if (temaValido(salvato)) return salvato;
  return preferisceChiaro ? 'pergamena' : 'tempesta';
}

/** Il colore con cui il browser tinge la propria cromatura: sul dispositivo
 *  bersaglio l'app è installata, quindi è una striscia di schermo intera
 *  sopra la pagina. Sono i valori di `--carta` dei due temi in tokens.css: se
 *  cambiano là, cambiano qui. Oggi il tema attivo lo scrive BaseLayout in
 *  build, senza passare da questa tabella; resta per quando ci sarà un
 *  secondo tema da scegliere a runtime — vedi BACKLOG.md. */
export const COLORE_TEMA: Record<Tema, string> = {
  tempesta: '#0a0c10',
  pergamena: '#efe7d6',
};
