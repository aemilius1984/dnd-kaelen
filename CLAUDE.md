# dnd-kaelen

Sito della scheda di Kaelen (D&D 2024, Chierico 3, Dominio della Tempesta),
sei rotte: `/` (splash), `/scheda/`, `/personaggio/`, `/storia/`,
`/preparati/`, `/note/`. Display da tavolo mobile-first, installabile come
PWA e utilizzabile offline, stato di sessione in localStorage.

## Vincoli

- HTML statico; il JavaScript è un'eccezione che deve chiedere permesso.
- Un'isola non contiene mai contenuto statico.
- La pagina `/storia/` non ha isole proprie: i capitoli sono HTML statico.
  L'unica isola presente è quella condivisa del menu, cromo globale di ogni
  pagina.
- I valori derivati (CA, CD, bonus, danni) si calcolano in `src/lib/derive.ts`,
  non si scrivono nei dati.
- Due temi, `tempesta` (default) e `pergamena`, differiscono **solo** nei token:
  nessun componente conosce il tema.
- Tutti i contenuti sono in italiano; sintesi proprie, mai testo dei manuali.
- Il middleware di Basic auth è fail-closed: senza segreti risponde 401.
- Verifica visiva sempre a 390×844.
- Prima di dichiarare finito qualcosa: `npm run gate`.

## Comandi

- `npm run dev` — sviluppo
- `npm run preview` — build servita in locale, per verificare offline/PWA
- `npm test` — Vitest
- `npm run gate` — check + test + build
