import { describe, expect, it } from 'vitest';
import { pianoPrecache, SOGLIA_PRECACHE } from '../precache.mjs';

// Il filtro di dimensione girava prima del ciclo che calcola l'impronta,
// quindi i file oltre soglia erano esclusi da tutti e due gli insiemi: la
// versione della cache non li vedeva mai. Sostituire il solo
// `kaelen-splash-desktop.webp` non avrebbe cambiato l'impronta, il service
// worker non avrebbe svuotato la cache vecchia e chi ha la PWA installata
// avrebbe continuato a vedere la splash di prima.

const grande = SOGLIA_PRECACHE + 1;

const voci = [
  { url: '/scheda/', percorso: 'dist/scheda/index.html', dimensione: 42_000 },
  {
    url: '/_astro/kaelen-splash-desktop.webp',
    percorso: 'dist/_astro/kaelen-splash-desktop.webp',
    dimensione: grande,
  },
  { url: '/', percorso: 'dist/index.html', dimensione: 9_000 },
];

describe('piano di precache', () => {
  const piano = pianoPrecache(voci);

  it('non fa scaricare i file oltre soglia all installazione', () => {
    expect(piano.precache).not.toContain('/_astro/kaelen-splash-desktop.webp');
    expect(piano.precache).toContain('/scheda/');
    expect(piano.precache).toContain('/');
  });

  it('conta comunque i file oltre soglia nell impronta della cache', () => {
    expect(piano.impronta.map((v) => v.url)).toContain('/_astro/kaelen-splash-desktop.webp');
  });

  it('tiene per ogni voce dell impronta il percorso da leggere', () => {
    const voce = piano.impronta.find((v) => v.url === '/_astro/kaelen-splash-desktop.webp');
    expect(voce?.percorso).toBe('dist/_astro/kaelen-splash-desktop.webp');
  });

  it('ordina entrambi gli insiemi, così due build uguali danno la stessa impronta', () => {
    expect(piano.precache).toEqual(['/', '/scheda/']);
    expect(piano.impronta.map((v) => v.url)).toEqual([
      '/',
      '/_astro/kaelen-splash-desktop.webp',
      '/scheda/',
    ]);
  });

  it('tiene un file esattamente sulla soglia', () => {
    const piano = pianoPrecache([
      { url: '/limite.webp', percorso: 'dist/limite.webp', dimensione: SOGLIA_PRECACHE },
    ]);
    expect(piano.precache).toEqual(['/limite.webp']);
  });
});
