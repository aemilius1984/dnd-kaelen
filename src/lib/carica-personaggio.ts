import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import { incantesimoSchema, personaggioSchema, type Incantesimo, type Personaggio } from './schema';

/** Legge il frontmatter della scheda e lo valida. Usato dai test: le pagine
 *  usano le content collections di Astro, che applicano lo stesso schema. */
export function caricaPersonaggioDaFile(percorso = 'src/content/character/kaelen.md'): Personaggio {
  const testo = readFileSync(percorso, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(testo);
  if (!match) throw new Error(`Frontmatter non trovato in ${percorso}`);
  return personaggioSchema.parse(parse(match[1]));
}

/** Legge tutti gli incantesimi della cartella e li valida. Usato dai test: le
 *  pagine usano le content collections di Astro, che applicano lo stesso schema. */
export function caricaIncantesimi(cartella = 'src/content/spells'): Map<string, Incantesimo> {
  const mappa = new Map<string, Incantesimo>();
  for (const file of readdirSync(cartella).filter((f) => f.endsWith('.md'))) {
    const testo = readFileSync(join(cartella, file), 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(testo);
    if (!match) throw new Error(`Frontmatter non trovato in ${file}`);
    mappa.set(basename(file, '.md'), incantesimoSchema.parse(parse(match[1])));
  }
  return mappa;
}
