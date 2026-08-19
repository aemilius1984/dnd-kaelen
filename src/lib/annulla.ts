import { signal } from '@preact/signals';

/** Quanto dura la finestra in cui si può disfare quel che si è appena speso.
 *  Un numero solo: il timer che *decide* sta qui, e la barra che lo racconta
 *  lo riceve come proprietà personalizzata invece di dichiararlo una seconda
 *  volta in CSS. Due numeri scritti a mano si sarebbero scollati al primo
 *  ripensamento, e il difetto sarebbe stato una barra che finisce prima o dopo
 *  il diritto di annullare. */
export const DURATA_ANNULLA = 5000;

/** L'azione che si può ancora disfare.
 *
 *  `detto` è cosa è stato fatto e `costo` cosa è costato, perché la modale si
 *  chiude subito e la striscia resta l'unica cosa in vista: senza il nome
 *  direbbe «Slot di 1° speso» a chi ha appena scelto fra sei incantesimi di
 *  1°. `disfa` è la sola cosa che sa come tornare indietro — chi dichiara
 *  l'azione la porta con sé, così questo modulo non conosce né slot né
 *  risorse. */
export interface Annullabile {
  detto: string;
  costo: string;
  disfa: () => void;
  /** Distingue due azioni identiche di fila: serve da chiave alla striscia,
   *  che deve rimontarsi per far ripartire la barra da piena, e serve al timer
   *  per sapere se la voce che sta scadendo è ancora la sua. */
  seriale: number;
}

/** Una sola voce, mai una pila: si annulla l'ultima azione, non uno storico.
 *  Un signal di modulo e non uno stato di componente perché a dichiarare sono
 *  in tanti — la modale di lancio, le card delle capacità, il pannello — e a
 *  disegnare è una striscia sola, montata una volta. */
export const annullabile = signal<Annullabile | null>(null);

let ultimoSeriale = 0;

export function dichiara(azione: Omit<Annullabile, 'seriale'>): void {
  annullabile.value = { ...azione, seriale: ++ultimoSeriale };
}

/** Disfa e sgombra. La seconda chiamata non fa niente: il bottone e la
 *  scadenza del timer possono arrivare insieme, e restituire due volte lo
 *  stesso slot sarebbe regalarne uno. */
export function disfaUltima(): void {
  const azione = annullabile.value;
  if (azione === null) return;
  annullabile.value = null;
  azione.disfa();
}

/** Fine finestra: la voce se ne va senza essere disfatta. Il seriale non è una
 *  formalità — il timer di un'azione può scadere dopo che un'altra ha preso il
 *  posto, e uno scarto alla cieca porterebbe via il diritto di annullare la
 *  seconda insieme alla coda della prima. */
export function scarta(seriale: number): void {
  if (annullabile.value?.seriale === seriale) annullabile.value = null;
}
