import type { Personaggio } from './schema';
import type { StatoSessione } from './sheet-state';
import { componiPunteggi, componiVoci, type Modifica, type VoceFinale } from './modifiche';

/** Kaelen com'è **in questo momento**.
 *
 *  `pg` è il personaggio dei dati con i punteggi già riscritti: tutto il resto
 *  della scheda continua a chiamare `derive.ts` come prima, solo su questo
 *  invece che sull'originale. È il motivo per cui `derive.ts` non cambia di una
 *  riga — `classeArmatura`, `perColpire`, `cdIncantesimi`, `capacitaTrasporto`
 *  non leggono altro che `pg`, e con la Forza a venti restituiscono sei numeri
 *  aggiornati senza una riga di aritmetica nuova.
 *
 *  `voci` sono gli addendi da applicare ai numeri già stampati. `promemoria` è
 *  quel che non diventa un numero e va detto in parole.
 *
 *  Tre sorgenti alimentano lo stesso calcolo: gli effetti temporanei, gli
 *  oggetti indossati, l'esaurimento. Hanno durate diverse e producono modifiche
 *  identiche, e una strada sola perché due strade per lo stesso numero sono due
 *  strade che prima o poi divergono. */
export interface Adesso {
  pg: Personaggio;
  voci: Record<VoceFinale, number>;
  promemoria: string[];
}

/** PHB 2024: ogni livello di esaurimento è −2 a ogni prova col d20 — prove,
 *  tiri salvezza e tiri per colpire — e −5 piedi di velocità. Tocca cinque voci
 *  insieme, ed è per questo che a mano si sbaglia sempre. */
export function modificheEsaurimento(livelli: number): Modifica[] {
  if (livelli <= 0) return [];
  return [
    { genere: 'voce', bersaglio: 'prove', valore: -2 * livelli },
    { genere: 'voce', bersaglio: 'ts', valore: -2 * livelli },
    { genere: 'voce', bersaglio: 'colpire', valore: -2 * livelli },
    { genere: 'voce', bersaglio: 'velocita', valore: -5 * livelli },
  ];
}

export function kaelenAdesso(pg: Personaggio, s: StatoSessione): Adesso {
  // I ripieghi non sono pedanteria: le isole montano prima che il segnale sia
  // inizializzato, e `stato.value` parte da un oggetto vuoto.
  const effetti = s.effetti ?? [];
  const indossati = new Set(s.indossati ?? []);
  const daOggetti = (s.oggettiAggiunti ?? [])
    .filter((o) => indossati.has(o.id) && o.quantita > 0)
    .flatMap((o) => o.modifiche);

  const tutte = [
    ...effetti.flatMap((e) => e.modifiche),
    ...daOggetti,
    ...modificheEsaurimento(s.esaurimento ?? 0),
  ];

  const caratteristiche = { ...pg.caratteristiche };
  for (const [chiave, valore] of Object.entries(componiPunteggi(tutte))) {
    const c = chiave as keyof typeof caratteristiche;
    // «Il punteggio diventa X» vale se non è già più alto: una cintura da
    // quindici non peggiora una Saggezza da sedici.
    caratteristiche[c] = Math.max(caratteristiche[c], valore as number);
  }

  return {
    pg: { ...pg, caratteristiche },
    voci: componiVoci(tutte),
    promemoria: effetti.map((e) => e.promemoria).filter((x): x is string => Boolean(x)),
  };
}

const ETICHETTE: [VoceFinale, string][] = [
  ['prove', 'alle prove'],
  ['ts', 'ai TS'],
  ['colpire', 'a colpire'],
];

/** Gli addendi che nessun numero in pagina porta, detti in parole.
 *
 *  Su `/scheda/` i portali riscrivono CA, CD e iniziativa: quelli si vedono. Le
 *  prove, i TS e i tiri per colpire stanno su venti carte diverse, e riscriverle
 *  tutte è una superficie che questa versione non apre. Una riga che dice
 *  «−2 alle prove» non mente; un numero base lasciato lì accanto a una riga che
 *  lo contraddice sarebbe peggio di entrambi. La CA è fuori dall'elenco proprio
 *  perché lì il portale c'è. */
export function riassuntoVoci(voci: Record<VoceFinale, number>): string | null {
  const pezzi = ETICHETTE.filter(([v]) => voci[v] !== 0).map(
    ([v, testo]) => `${segnoTipografico(voci[v])} ${testo}`,
  );
  if (voci.velocita !== 0) pezzi.push(`${segnoTipografico(voci.velocita)} ft di velocità`);
  return pezzi.length === 0 ? null : pezzi.join(' · ');
}

/** Il meno tipografico, non il trattino da tastiera: in mezzo ai numeri della
 *  scheda «-2» si legge come una sillabazione. Lo stesso segno che `Borsa` usa
 *  già sul bottone della quantità. */
function segnoTipografico(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}
