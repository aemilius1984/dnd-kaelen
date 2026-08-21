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
- Un tema solo, `pergamena`, scritto su `<html>` in build. I componenti non
  conoscono il tema: differenze solo nei token. Tempesta è spento ma i suoi
  token restano — vedi `BACKLOG.md`.
- Tutti i contenuti sono in italiano; sintesi proprie, mai testo dei manuali.
- Il middleware di Basic auth è fail-closed: senza segreti risponde 401. Copre
  anche `/api/`: gli endpoint delle sessioni non hanno un'autenticazione
  propria.
- La nuvola è facoltativa. Senza rete, senza binding o con D1 muta il sito
  resta quello di oggi e nessun comando tocca lo stato locale. Il gate non
  parla con Cloudflare: gli endpoint si provano con un `D1Database` finto.
- Verifica visiva sempre a 390×844.
- Prima di dichiarare finito qualcosa: `npm run gate`.

## Comandi

- `npm run dev` — sviluppo. I woff2 in `public/fonts/` e le icone PNG del
  manifest le genera `prebuild`, che gira per `build` e non per `dev`: su un
  clone fresco `npm run dev` mostra il serif di ripiego e fa 404 sui font e
  sulle icone finché non si lancia almeno una volta `npm run build` (o
  direttamente `npm run prebuild`).
- `npm run preview` — build servita in locale, per verificare offline/PWA
- `npm test` — Vitest
- `npm run gate` — check + test + build

## La nuvola delle sessioni

Salvataggio e ripristino della sessione passano da Cloudflare D1, tramite le
Pages Functions in `functions/api/`. Il binding si chiama **`DB` in tutti e due
gli ambienti** (Production su `kaelen`, Preview su `kaelen-preview`) e si
imposta dalla dashboard, Settings → Bindings: entra in vigore al deploy
successivo, non subito.

Le migrazioni **non le applica nessun hook**: se il codice arriva in produzione
prima della migrazione, l'endpoint trova la tabella che non c'è.

Si passa sempre il **binding**, `DB`, mai il nome del database: `wrangler` risolve
l'argomento contro `wrangler.jsonc`, dove c'è una voce sola. `kaelen-preview` lì
dentro non compare come nome, e chiederlo per nome dà «Couldn't find a D1 DB» —
al Preview ci si arriva con `--preview`, che usa `preview_database_id`.

```
npx wrangler d1 migrations apply DB --local              # sviluppo, SQLite locale
npx wrangler d1 migrations apply DB --remote            # Production, prima del deploy
npx wrangler d1 migrations apply DB --remote --preview  # Preview
```

Per provarla in locale servono le Functions, che `astro dev` non esegue:

```
npm run build && npx wrangler pages dev ./dist
```

`wrangler.jsonc` serve solo al locale e **non ha `pages_build_output_dir`**:
quella chiave renderebbe il file la fonte di verità del progetto, e un deploy
porterebbe in produzione una configurazione scritta per lo sviluppo.
