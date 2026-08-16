import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Il service worker non è un modulo importabile: è un template con due
// segnaposto che `scripts/build-sw.mjs` riempie a build time. Qui lo si
// istanzia come lo istanzierebbe la build e lo si esegue dentro un finto
// ServiceWorkerGlobalScope, così il comportamento offline è verificabile
// senza un browser.

const ORIGINE = 'https://kaelen.potenza.dev';

type FintaRichiesta = { url: string; method: string; mode: string };

function richiesta(url: string, mode = 'no-cors'): FintaRichiesta {
  return { url: ORIGINE + url, method: 'GET', mode };
}

/**
 * Esegue il template con un precache finto e una rete che fallisce sempre,
 * e restituisce la funzione che risolve un `fetch` event come lo farebbe il
 * browser: dato un URL, la Response che il service worker gli consegna.
 */
function serviceWorkerOffline(cache: Record<string, { corpo: string; tipo: string }>) {
  const template = readFileSync('src/sw-template.js', 'utf8');
  const codice = template
    .replace('__VERSIONE__', 'kaelen-test')
    .replace('__PRECACHE__', JSON.stringify(Object.keys(cache)));

  const gestori: Record<string, (e: unknown) => void> = {};
  const self = {
    addEventListener: (nome: string, gestore: (e: unknown) => void) => {
      gestori[nome] = gestore;
    },
    location: { origin: ORIGINE },
    skipWaiting: () => {},
    clients: { claim: () => {} },
  };

  const caches = {
    open: async () => ({ addAll: async () => {}, put: async () => {} }),
    keys: async () => [],
    delete: async () => true,
    match: async (chiave: string | FintaRichiesta) => {
      const url = typeof chiave === 'string' ? chiave : chiave.url.slice(ORIGINE.length);
      const voce = cache[url];
      if (!voce) return undefined;
      return new Response(voce.corpo, { headers: { 'Content-Type': voce.tipo } });
    },
  };

  // La rete è giù: è la condizione che stiamo verificando.
  const fetch = async () => {
    throw new TypeError('Failed to fetch');
  };

  new Function('self', 'caches', 'fetch', codice)(self, caches, fetch);

  // `undefined` significa che il service worker non ha chiamato
  // `respondWith`: la richiesta va alla rete senza passare da lui.
  return async (r: FintaRichiesta): Promise<Response | undefined> => {
    let risposta: Promise<Response> | undefined;
    gestori.fetch({ request: r, respondWith: (p: Promise<Response>) => (risposta = p) });
    return risposta === undefined ? undefined : await risposta;
  };
}

describe('service worker offline', () => {
  const cache = {
    '/': { corpo: '<!doctype html><title>Kaelen</title>', tipo: 'text/html; charset=utf-8' },
    '/scheda/': { corpo: '<!doctype html><title>Scheda</title>', tipo: 'text/html; charset=utf-8' },
    '/_astro/noto.js': { corpo: 'export const a = 1;', tipo: 'text/javascript' },
  };

  it('serve dalla cache quello che ha, senza toccare la rete', async () => {
    const sw = serviceWorkerOffline(cache);
    const risposta = await sw(richiesta('/scheda/', 'navigate'));

    expect(risposta?.status).toBe(200);
    expect(await risposta?.text()).toContain('Scheda');
  });

  it('ripiega sulla home per una navigazione verso una rotta non in cache', async () => {
    const sw = serviceWorkerOffline(cache);
    const risposta = await sw(richiesta('/rotta-nuova/', 'navigate'));

    expect(risposta?.status).toBe(200);
    expect(await risposta?.text()).toContain('Kaelen');
  });

  it('non serve HTML a una richiesta di script mancante', async () => {
    // Dopo un deploy la cache può contenere un HTML che punta a bundle con
    // hash nuovi, mai precacheati. Se a quella richiesta rispondiamo con la
    // home, il browser rifiuta il modulo con un errore di MIME type che non
    // dice niente a chi lo legge; deve invece fallire in modo leggibile.
    const sw = serviceWorkerOffline(cache);
    const risposta = await sw(richiesta('/_astro/mai-visto.js'));

    expect(risposta?.status).toBe(503);
    expect(risposta?.headers.get('Content-Type')).toContain('text/plain');
    expect(await risposta?.text()).not.toContain('<!doctype html>');
  });

  it('non serve HTML a un foglio di stile mancante', async () => {
    const sw = serviceWorkerOffline(cache);
    const risposta = await sw(richiesta('/_astro/mai-visto.css'));

    expect(risposta?.status).toBe(503);
  });

  it('serve lo script che ha in cache anche con la rete giù', async () => {
    const sw = serviceWorkerOffline(cache);
    const risposta = await sw(richiesta('/_astro/noto.js'));

    expect(risposta?.status).toBe(200);
    expect(await risposta?.text()).toContain('export const a');
  });

  it('non lascia una navigazione senza risposta nemmeno con la home fuori cache', async () => {
    // Non succede finché `/` è nel precache, ma è l'ultima rete di sicurezza:
    // `respondWith(undefined)` diventerebbe un errore di rete muto.
    const senzaHome = { '/scheda/': cache['/scheda/'] };
    const sw = serviceWorkerOffline(senzaHome);
    const risposta = await sw(richiesta('/rotta-nuova/', 'navigate'));

    expect(risposta?.status).toBe(503);
    expect(risposta?.headers.get('Content-Type')).toContain('text/plain');
  });

  it('non intercetta le richieste verso altre origini', async () => {
    const sw = serviceWorkerOffline(cache);
    const risposta = await sw({
      url: 'https://esempio.invalid/tracker.js',
      method: 'GET',
      mode: 'no-cors',
    });

    expect(risposta).toBeUndefined();
  });
});
