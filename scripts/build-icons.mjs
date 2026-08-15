import { mkdir, copyFile } from 'node:fs/promises';
import sharp from 'sharp';

const SORGENTE = 'src/assets/icon.svg';
const USCITE = [
  { file: 'public/icon-192.png', lato: 192 },
  { file: 'public/icon-512.png', lato: 512 },
  { file: 'public/apple-touch-icon.png', lato: 180 },
];

await mkdir('public', { recursive: true });
for (const { file, lato } of USCITE) {
  await sharp(SORGENTE, { density: 384 }).resize(lato, lato).png().toFile(file);
  console.log(`icona generata: ${file}`);
}

await copyFile(SORGENTE, 'public/icon.svg');
console.log('icona copiata: public/icon.svg');
