import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Copiamo i soli sottoinsiemi latini: il resto (cirillico, greco, vietnamita)
// non serve a un sito interamente in italiano e triplicherebbe il peso.
const FILE = [
  ['@fontsource/marcellus', 'marcellus-latin-400-normal.woff2'],
  ['@fontsource/eb-garamond', 'eb-garamond-latin-400-normal.woff2'],
  ['@fontsource/eb-garamond', 'eb-garamond-latin-400-italic.woff2'],
];

await mkdir('public/fonts', { recursive: true });
for (const [pacchetto, nome] of FILE) {
  await copyFile(join('node_modules', pacchetto, 'files', nome), join('public/fonts', nome));
}
console.log(`font copiati: ${FILE.length}`);
