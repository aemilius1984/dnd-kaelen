import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import BaseLayout from '@/layouts/BaseLayout.astro';

// `/sw.js` non è un file sorgente: lo scrive `scripts/build-sw.mjs` dentro
// `dist/` dopo `astro build`. Sotto `astro dev` non esiste e non può esistere,
// quindi registrarlo lì significa una 404 per ogni pagina aperta. La
// registrazione deve comparire solo nella build di produzione — che è anche
// quella servita da `npm run preview`, dove la PWA si verifica davvero.
describe('BaseLayout', () => {
  it('non registra il service worker fuori dalla build di produzione', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { titolo: 'Prova', attiva: null },
    });

    expect(import.meta.env.PROD).toBe(false);
    expect(html).not.toContain('sw.js');
    expect(html).not.toContain('serviceWorker');
  });

  it('dichiara la zona sicura, senza la quale ogni env() del sito vale zero', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { titolo: 'Prova', attiva: null },
    });

    // Gli `env(safe-area-inset-*)` sparsi per il progetto erano codice morto:
    // su iOS il browser non li popola finché il viewport non dichiara di
    // volersi prendere anche gli angoli. Senza questo valore, la tacca non
    // esiste e la home non arriva mai sotto la dynamic island.
    expect(html).toMatch(/name="viewport"[^>]*viewport-fit=cover/);
  });

  it('scrive il tema in build, senza script che lo scelga a runtime', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { titolo: 'Prova', attiva: null },
    });

    expect(html).toContain('data-tema="pergamena"');
    // Lo script anti-lampeggio esisteva solo per scegliere fra due temi: con un
    // tema solo è codice che gira su ogni pagina per non decidere niente.
    expect(html).not.toContain('kaelen:tema');
    expect(html).not.toContain('prefers-color-scheme');
  });
});

it('l’apertura delle modali è dichiarata una volta sola', () => {
  // Ne esistevano tre copie — archivio, armi, incantesimi — e ognuna
  // scandiva l'intero documento: tre ascoltatori su ogni bottone e tre
  // `showModal()` per click. Non dava errore perché un dialogo già modale
  // ignora la seconda chiamata, e sarebbe rimasto invisibile fino al giorno in
  // cui uno di quei bottoni avesse commutato invece di aprire.
  const sorgenti = [
    ...readdirSync('src/components')
      .filter((f) => f.endsWith('.astro'))
      .map((f) => `src/components/${f}`),
    ...readdirSync('src/pages')
      .filter((f) => f.endsWith('.astro'))
      .map((f) => `src/pages/${f}`),
    'src/layouts/BaseLayout.astro',
  ];

  const dichiarano = sorgenti.filter((f) => readFileSync(f, 'utf8').includes('showModal'));

  expect(dichiarano).toEqual(['src/layouts/BaseLayout.astro']);
});
