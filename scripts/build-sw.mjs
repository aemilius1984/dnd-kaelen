import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const DIST = 'dist';
const ESTENSIONI = ['.html', '.css', '.js', '.webmanifest', '.png', '.svg'];

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
const urls = file
  .map((f) => '/' + relative(DIST, f).split(/[\\/]/).join('/'))
  .map((u) => (u.endsWith('/index.html') ? u.slice(0, -'index.html'.length) : u))
  .filter((u) => !u.endsWith('/sw.js'));

const impronta = createHash('sha256').update(urls.sort().join('|')).digest('hex').slice(0, 12);
const template = await readFile('src/sw-template.js', 'utf8');
const sw = template
  .replace('__VERSIONE__', `kaelen-${impronta}`)
  .replace('__PRECACHE__', JSON.stringify([...new Set(urls)].sort(), null, 2));

await writeFile(join(DIST, 'sw.js'), sw);
console.log(`service worker scritto: ${urls.length} file in precache`);
