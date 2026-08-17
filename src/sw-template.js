const CACHE = '__VERSIONE__';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Ultima rete di sicurezza: se non c'è una risposta in cache e la rete fallisce,
// niente deve arrivare a `respondWith(undefined)` (errore di rete a livello di
// browser). Si prova la home precaricata, poi in ultima istanza una risposta
// sintetica: così qualunque URL non precacheato fallisce in modo leggibile
// invece che con un errore muto.
function rispostaOffline() {
  return new Response('Contenuto non disponibile offline.', {
    status: 503,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

// Il ripiego sulla home vale solo per le navigazioni. Servirlo anche a
// script, fogli di stile e immagini significa consegnare dell'HTML a chi
// aspetta altro: il browser rifiuta il modulo con un errore di MIME type
// («expected a JavaScript module script but the server responded with
// text/html») che nasconde la causa vera, cioè che quel file non era in
// cache. Succede davvero dopo un deploy, quando un HTML già in cache punta
// a bundle con hash che questa cache non ha mai visto. Meglio un 503
// esplicito, che si legge per quello che è.
function ripiego(richiesta) {
  if (richiesta.mode !== 'navigate') return rispostaOffline();
  return caches.match('/').then((home) => home || rispostaOffline());
}

self.addEventListener('fetch', (e) => {
  const richiesta = e.request;
  if (richiesta.method !== 'GET' || new URL(richiesta.url).origin !== self.location.origin) return;

  e.respondWith(
    caches.match(richiesta).then((salvata) => {
      const dalla_rete = fetch(richiesta)
        .then((risposta) => {
          if (risposta.ok && risposta.type === 'basic') {
            const copia = risposta.clone();
            caches.open(CACHE).then((c) => c.put(richiesta, copia));
          }
          return risposta;
        })
        .catch(() => salvata || ripiego(richiesta));
      return salvata || dalla_rete;
    }),
  );
});
