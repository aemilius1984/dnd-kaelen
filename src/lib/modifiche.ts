import { z } from 'zod';

/** Il vocabolario chiuso delle modifiche a Kaelen. Sta in un modulo suo, senza
 *  dipendenze, perché lo leggono in quattro — lo schema degli incantesimi, gli
 *  effetti, gli oggetti indossati, il motore — e ognuno importandolo dagli
 *  altri chiuderebbe un ciclo.
 *
 *  Due generi, e sono davvero due cose diverse. Un `punteggio` è **assoluto**:
 *  il manuale scrive che con una Cintura di Forza del Gigante il punteggio
 *  *diventa* ventuno, non che sale di cinque. Una `voce` è un **addendo** su un
 *  numero già stampato sulla scheda. Da questa differenza vengono le due regole
 *  di composizione qui sotto, che non sono una scelta di gusto: i punteggi che
 *  si sommassero darebbero quarantuno di Forza. */

/** I numeri già stampati sulla scheda su cui una modifica è un addendo.
 *  Cinque, e allungare l'elenco è una decisione: significa che esiste un altro
 *  numero in pagina che qualcuno deve andare a riscrivere. */
export const vociFinali = ['ca', 'ts', 'colpire', 'prove', 'velocita'] as const;
export type VoceFinale = (typeof vociFinali)[number];

/** Le sei di sempre. Ricopiate e non importate da `schema.ts`: importarle
 *  chiuderebbe un ciclo, perché è `schema.ts` a importare `modificaSchema`.
 *  Che restino le stesse lo garantisce un test in `modifiche.test.ts`. */
export const caratteristicheModificabili = ['for', 'des', 'cos', 'int', 'sag', 'car'] as const;

/** Union discriminata e non un oggetto piatto con `bersaglio` largo: una voce
 *  finale col genere `punteggio` è uno stato illegale, e in forma piatta il
 *  compilatore lo lascerebbe passare fino al primo numero sbagliato in pagina. */
export const modificaSchema = z.discriminatedUnion('genere', [
  z.object({
    genere: z.literal('punteggio'),
    bersaglio: z.enum(caratteristicheModificabili),
    valore: z.number().int(),
  }),
  z.object({
    genere: z.literal('voce'),
    bersaglio: z.enum(vociFinali),
    valore: z.number().int(),
  }),
]);

export type Modifica = z.infer<typeof modificaSchema>;

type Punteggi = Partial<Record<(typeof caratteristicheModificabili)[number], number>>;

/** Il più alto vince. È la regola generale del regolamento sugli effetti che
 *  non si cumulano, e qui vale fra le modifiche: il confronto con il punteggio
 *  *di base* lo fa `kaelenAdesso`, che è l'unico posto che il personaggio ce
 *  l'ha davanti. */
export function componiPunteggi(modifiche: Modifica[]): Punteggi {
  const out: Punteggi = {};
  for (const m of modifiche) {
    if (m.genere !== 'punteggio') continue;
    const attuale = out[m.bersaglio];
    out[m.bersaglio] = attuale === undefined ? m.valore : Math.max(attuale, m.valore);
  }
  return out;
}

/** Queste invece si sommano davvero: Scudo della Fede e uno scudo magico danno
 *  insieme tre punti di CA, ed è corretto. Zero e non `undefined` sulle voci
 *  intonse, così chi legge somma senza guardie. */
export function componiVoci(modifiche: Modifica[]): Record<VoceFinale, number> {
  const out = { ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 };
  for (const m of modifiche) {
    if (m.genere === 'voce') out[m.bersaglio] += m.valore;
  }
  return out;
}
