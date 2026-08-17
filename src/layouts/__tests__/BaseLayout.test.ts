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
});
