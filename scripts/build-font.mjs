import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { FONT } from './font-elenco.mjs';

await mkdir('public/fonts', { recursive: true });
for (const [pacchetto, nome] of FONT) {
  await copyFile(join('node_modules', pacchetto, 'files', nome), join('public/fonts', nome));
}
console.log(`font copiati: ${FONT.length}`);
