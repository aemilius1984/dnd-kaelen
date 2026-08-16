import { getCollection, getEntry } from 'astro:content';
import type { Personaggio } from './schema';
import type { VoceIncantesimo } from './storage';
import { campiVersione, hashDati } from './sheet-version';

/** Carica la scheda di Kaelen dalle content collection di Astro: normalizza i
 *  riferimenti a incantesimi (trucchetti, preparati iniziali, dominio) da
 *  `reference()` a slug stringa, costruisce il pool degli incantesimi
 *  selezionabili e calcola `sheetVersion`. Usato da ogni pagina che ha
 *  bisogno dei dati del personaggio, così ne esiste una sola forma in tutto
 *  il sito. Non confondere con `carica-personaggio.ts`: quello legge il
 *  markdown da disco per i test, questo gira a build time sopra le content
 *  collection di Astro — runtime diversi, non si possono unire. */
export async function caricaScheda(): Promise<{
  pg: Personaggio;
  pool: VoceIncantesimo[];
  sheetVersion: string;
}> {
  const voce = await getEntry('character', 'kaelen');
  if (!voce) throw new Error('Scheda di Kaelen non trovata');

  // `reference()` trasforma gli slug in oggetti { id, collection }. Li riportiamo a
  // stringhe: così questo oggetto combacia con il tipo `Personaggio` usato da derive,
  // dai componenti e dallo stato di sessione, e ne esiste una sola forma in tutto il sito.
  const dati = voce.data;
  const pg: Personaggio = {
    ...dati,
    trucchetti: dati.trucchetti.map((r) => r.id),
    preparatiIniziali: dati.preparatiIniziali.map((r) => r.id),
    dominio: dati.dominio.map((r) => r.id),
  };

  const pool = (await getCollection('spells'))
    .map((m) => ({
      slug: m.id,
      nome: m.data.nome,
      livello: m.data.livello,
      dominio: m.data.dominio,
    }))
    .filter((m) => m.livello > 0 && !m.dominio)
    .sort((a, b) => a.livello - b.livello || a.nome.localeCompare(b.nome, 'it'));

  // `pg` è già normalizzato a slug stringa: è la stessa forma che le isole
  // ricevono nel blocco JSON, quindi l'hash è stabile fra build identiche. Hash solo
  // sui campi da cui `StatoSessione` dipende (vedi campiVersione): correggere un
  // refuso nelle capacità o nelle reazioni non deve azzerare la sessione salvata.
  const sheetVersion = hashDati(JSON.stringify(campiVersione(pg, pool)));

  return { pg, pool, sheetVersion };
}
