import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const DIST = 'dist';
const ESTENSIONI = ['.html', '.css', '.js', '.webmanifest', '.png', '.svg', '.webp', '.woff2'];

// Le immagini grandi non pesano sull'installazione: chi gioca dal telefono
// non deve scaricare lo splash da desktop per andare offline. Sopra la
// soglia si mettono in cache alla prima visualizzazione, per via della
// strategia stale-while-revalidate già attiva nel fetch handler.
// 200 KiB: sotto lo splash mobile (~161 KiB) e il ritratto di /personaggio/
// (~164 KiB), sopra lo splash desktop (~213 KiB) — verificato sui file
// prodotti da `astro build`, non sui sorgenti non ottimizzati.
const SOGLIA_PRECACHE = 200 * 1024;

async function elenca(cartella) {
  const voci = await readdir(cartella, { withFileTypes: true });
  const file = await Promise.all(
    voci.map(async (v) => {
      const percorso = join(cartella, v.name);
      if (v.isDirectory()) return elenca(percorso);
      return ESTENSIONI.some((e) => v.name.endsWith(e)) ? [percorso] : [];
    }),
  );
  return file.flat();
}

const file = await elenca(DIST);

// Mappa url del precache -> percorso reale su disco, così l'impronta può
// essere calcolata sul contenuto dei file e non solo sui loro nomi: i
// bundle in _astro/ hanno il nome con l'hash e cambiano da soli, ma
// index.html no, quindi un edit ai contenuti (es. src/content/character/
// kaelen.md) deve comunque invalidare la cache.
const percorsi = new Map();
for (const f of file) {
  let url = '/' + relative(DIST, f).split(/[\\/]/).join('/');
  if (url.endsWith('/index.html')) url = url.slice(0, -'index.html'.length);
  if (url.endsWith('/sw.js')) continue;
  const { size } = await stat(f);
  if (size > SOGLIA_PRECACHE) continue;
  percorsi.set(url, f);
}

const urls = [...percorsi.keys()].sort();

const impronta_hash = createHash('sha256');
for (const url of urls) {
  const contenuto = await readFile(percorsi.get(url));
  impronta_hash.update(url).update(contenuto);
}
const impronta = impronta_hash.digest('hex').slice(0, 12);

const template = await readFile('src/sw-template.js', 'utf8');
const sw = template
  .replace('__VERSIONE__', `kaelen-${impronta}`)
  .replace('__PRECACHE__', JSON.stringify(urls, null, 2));

await writeFile(join(DIST, 'sw.js'), sw);
console.log(`service worker scritto: ${urls.length} file in precache, cache=kaelen-${impronta}`);
