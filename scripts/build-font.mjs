import { copyFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { FONT } from './font-elenco.mjs';

// public/fonts/ è gitignored e non viene mai svuotata da sola: su una
// macchina che ha già buildato prima di un cambio di font, la faccia vecchia
// (es. Marcellus) sopravvivrebbe qui, `astro build` la copierebbe in dist/, e
// il service worker la precaricherebbe offline insieme a quelle vere.
await rm('public/fonts', { recursive: true, force: true });
await mkdir('public/fonts', { recursive: true });
for (const [pacchetto, nome] of FONT) {
  await copyFile(join('node_modules', pacchetto, 'files', nome), join('public/fonts', nome));
}
console.log(`font copiati: ${FONT.length}`);
