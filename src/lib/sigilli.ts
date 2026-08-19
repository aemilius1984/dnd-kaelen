import type { Incantesimo } from './schema';

/** Il pool preparabile è di 32 incantesimi: un glifo per ciascuno non è
 *  sostenibile e non serve. Ne disegniamo tredici — i tre trucchetti, i
 *  quattro del dominio e i sei preparati iniziali — e tutto il resto ripiega
 *  sull'icona del proprio tag. Ogni incantesimo ha almeno un tag (lo
 *  verifica incantesimi.test.ts), quindi il ripiego non fallisce mai. */
const PROPRI: Record<string, string> = {
  guida: 'sig-guida',
  'fiamma-sacra': 'sig-fiamma-sacra',
  taumaturgia: 'sig-taumaturgia',
  'nube-di-nebbia': 'sig-nube',
  'onda-tonante': 'sig-onda',
  'folata-di-vento': 'sig-folata',
  frantumare: 'sig-frantumare',
  benedizione: 'sig-benedizione',
  comando: 'sig-comando',
  'cura-ferite': 'sig-cura-ferite',
  'parola-guaritrice': 'sig-parola',
  aiuto: 'sig-aiuto',
  'blocca-persone': 'sig-blocca',
};

const PER_TAG: Record<Incantesimo['tag'][number], string> = {
  cura: 'tag-cura',
  danno: 'tag-danno',
  controllo: 'tag-controllo',
  utilità: 'tag-utilita',
};

export function haSigilloProprio(slug: string): boolean {
  return slug in PROPRI;
}

/** Il sigillo proprio di un incantesimo, o `null` se non ne ha uno.
 *
 *  Diverso da `simbolo()`, che non torna mai `null` perché ripiega sull'icona
 *  del tag. Il ripiego va bene in una card, dove accanto c'è il nome scritto;
 *  non va bene in una casella di slot, dove il sigillo è l'unica cosa che c'è
 *  e l'icona del tag direbbe «un incantesimo di cura» invece di «questo
 *  incantesimo». Chi chiama questa decide cosa fare del `null`. */
export function sigilloProprio(slug: string): string | null {
  return PROPRI[slug] ?? null;
}

export function simbolo(slug: string, tag: Incantesimo['tag']): string {
  return PROPRI[slug] ?? PER_TAG[tag[0]];
}

/** Il sigillo di un uso di una risorsa — i tre di Incanalare Divinità.
 *
 *  Non ripiega su niente: le risorse con un uso solo non ne hanno bisogno, e
 *  la casella consumata resta piena e basta. Chi chiama decide cosa fare del
 *  `null`, come per `sigilloProprio`.
 *
 *  La convenzione lega l'id dell'uso al nome del simbolo, invece di una
 *  seconda tabella: `usi-e-sigilli.test.ts` verifica che ogni uso nei dati
 *  trovi il proprio glifo nello sprite, così un uso nuovo senza disegno non
 *  passa in silenzio come casella vuota. */
export function sigilloUso(idUso: string): string {
  return `uso-${idUso}`;
}
