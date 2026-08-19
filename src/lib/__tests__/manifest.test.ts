import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { pianoPrecache } from '../../../scripts/precache.mjs';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));

describe('l’app installata', () => {
  it('atterra sulla home, non sulla scheda', () => {
    // La home è la porta del sito: aprirla dall’icona significa vedere la
    // fotografia, non saltarla. Lo scope resta la radice perché tutte e sei
    // le rotte devono restare dentro l’app installata.
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
  });

  it('parte sul fondo della fotografia, non sulla pergamena', () => {
    // `background_color` è quello che iOS dipinge nell’attesa fra il tocco
    // sull’icona e il primo paint. Con la pergamena la partenza era un lampo
    // chiaro seguito da una schermata notturna.
    expect(manifest.background_color).toBe('#24282c');
    // `theme_color` invece parla dell’app in generale, e cinque rotte su sei
    // sono di carta: resta pergamena. Il colore della singola rotta lo dice
    // il meta di BaseLayout.
    expect(manifest.theme_color).toBe('#efe7d6');
  });

  it('ha la pagina d’avvio nel precache', () => {
    // Una PWA che si apre offline su una pagina non memorizzata è una
    // schermata bianca. Finché `start_url` era `/scheda/` la home poteva
    // anche mancare; adesso è la prima cosa che l’app chiede.
    const voci = [
      { url: '/', percorso: 'dist/index.html', dimensione: 20_000 },
      { url: '/scheda/', percorso: 'dist/scheda/index.html', dimensione: 40_000 },
    ];
    expect(pianoPrecache(voci).precache).toContain(manifest.start_url);
  });
});
