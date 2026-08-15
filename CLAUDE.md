# dnd-kaelen

Sito della scheda di Kaelen (D&D 2024, Chierico 3, Dominio della Tempesta).
Display da tavolo mobile-first, stato di sessione in localStorage.

## Vincoli

- HTML statico; il JavaScript è un'eccezione che deve chiedere permesso.
- Un'isola non contiene mai contenuto statico.
- I valori derivati (CA, CD, bonus, danni) si calcolano in `src/lib/derive.ts`,
  non si scrivono nei dati.
- Tutti i contenuti sono in italiano; sintesi proprie, mai testo dei manuali.
- Il middleware di Basic auth è fail-closed: senza segreti risponde 401.
- Prima di dichiarare finito qualcosa: `npm run gate`.

## Comandi

- `npm run dev` — sviluppo
- `npm test` — Vitest
- `npm run gate` — check + test + build
