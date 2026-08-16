import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { pianoPrecache } from './precache.mjs';

const DIST = 'dist';
const ESTENSIONI = ['.html', '.css', '.js', '.webmanifest', '.png', '.svg', '.webp', '.woff2'];

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

// Ogni file di dist con il suo url e la sua dimensione: è `pianoPrecache` a
// decidere cosa entra nel precache e cosa entra nell'impronta — due insiemi
// diversi, vedi il commento lì.
const voci = [];
for (const f of file) {
  let url = '/' + relative(DIST, f).split(/[\\/]/).join('/');
  if (url.endsWith('/index.html')) url = url.slice(0, -'index.html'.length);
  if (url.endsWith('/sw.js')) continue;
  const { size } = await stat(f);
  voci.push({ url, percorso: f, dimensione: size });
}

const { precache: urls, impronta: daImprontare } = pianoPrecache(voci);

// L'impronta si calcola sul contenuto dei file e non solo sui loro nomi: i
// bundle in _astro/ hanno il nome con l'hash e cambiano da soli, ma
// index.html no, quindi un edit ai contenuti (es. src/content/character/
// kaelen.md) deve comunque invalidare la cache.
const impronta_hash = createHash('sha256');
for (const { url, percorso } of daImprontare) {
  const contenuto = await readFile(percorso);
  impronta_hash.update(url).update(contenuto);
}
const impronta = impronta_hash.digest('hex').slice(0, 12);

const template = await readFile('src/sw-template.js', 'utf8');
const sw = template
  .replace('__VERSIONE__', `kaelen-${impronta}`)
  .replace('__PRECACHE__', JSON.stringify(urls, null, 2));

await writeFile(join(DIST, 'sw.js'), sw);
console.log(`service worker scritto: ${urls.length} file in precache, cache=kaelen-${impronta}`);
