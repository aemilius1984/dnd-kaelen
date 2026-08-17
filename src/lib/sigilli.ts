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

export function simbolo(slug: string, tag: Incantesimo['tag']): string {
  return PROPRI[slug] ?? PER_TAG[tag[0]];
}
