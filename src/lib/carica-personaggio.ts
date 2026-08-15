import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { personaggioSchema, type Personaggio } from './schema';

/** Legge il frontmatter della scheda e lo valida. Usato dai test: le pagine
 *  usano le content collections di Astro, che applicano lo stesso schema. */
export function caricaPersonaggioDaFile(percorso = 'src/content/character/kaelen.md'): Personaggio {
  const testo = readFileSync(percorso, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(testo);
  if (!match) throw new Error(`Frontmatter non trovato in ${percorso}`);
  return personaggioSchema.parse(parse(match[1]));
}
