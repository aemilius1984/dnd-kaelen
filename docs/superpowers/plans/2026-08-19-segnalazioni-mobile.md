# Segnalazioni mobile — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quattro segnalazioni raccolte a voce il 2026-08-19: la home a schermo pieno su iOS, i due numeri di lancio che restano in vista, il consumo delle capacità dove sta la capacità, e il ⚡ rifondato su ciò che gli resta — riposi, nuvola, correzioni a mano.

**Architecture:** Tre movimenti indipendenti e uno che dipende dagli altri. (1) La zona sicura si accende per la prima volta su tutto il sito: un valore in più nel meta `viewport`, due token che portano la tacca dentro le altezze già esistenti. (2) Le capacità prendono il modello degli incantesimi — card muta, comando che spende, annulla a 5 secondi — e per farlo `risorseUsate` diventa una lista come `slotSpesi`. (3) La nuvola è una tabella D1 dietro il Basic auth che esiste già, comandata a mano, facoltativa per costruzione. (4) Il ⚡ si pota di tutto ciò che ha trovato un'altra casa, e questo si può fare solo dopo (2).

**Tech Stack:** Astro 7 statico, isole Preact (`client:only`), `@preact/signals`, CSS a mano con i token di `tokens.css`, vitest + jsdom, Pages Functions + D1, Chrome 151 via CDP per la prova con gli inset simulati.

**Spec:** `docs/superpowers/specs/2026-08-19-segnalazioni-mobile.md`

## Ordine di esecuzione

I task **non** sono tutti indipendenti:

- **1 → 4** sono la segnalazione 1 e vanno in ordine fra loro (il Task 1 è il fondamento: senza `viewport-fit=cover` il 3 non si vede).
- **5** è isolato: si può fare in qualunque momento.
- **6 → 7 → 8 → 9** sono la segnalazione 3 e la catena è stretta: i dati, poi la forma dello stato, poi l'annulla condiviso, poi il consumo dalle card.
- **10** dipende dal **9**: potare il ⚡ prima che le capacità si spendano dalle card lascerebbe Kaelen senza modo di spendere Incanalare Divinità.
- **11 → 12** sono la nuvola e stanno in fondo perché il Task 12 vive dentro il pannello che il Task 10 ha appena rifatto.
- **13** chiude: è la misura, e misura tutto.

## Global Constraints

- Tutta la prosa visibile e i commenti sono **in italiano**; i soggetti dei commit in inglese.
- HTML statico: il JavaScript è un'eccezione che deve chiedere permesso. I Task 1–5 non ne aggiungono; dal 6 in poi ogni riga nuova sta dentro un'isola che esisteva già o dentro una funzione pura provabile in vitest.
- **Un'isola non contiene mai contenuto statico.** Vale in particolare per il Task 5, dove i due numeri derivati vanno nel contenitore e non dentro `BarraSlot`.
- I valori derivati si calcolano in `src/lib/derive.ts`, non si scrivono nei dati.
- Nessun numero magico nuovo: `3.25rem` e `3.75rem` sono già ripetuti in quattro punti e in questo piano diventano un token solo.
- Ogni `env()` porta il suo valore di ripiego (`env(safe-area-inset-top, 0px)`): su desktop e su Android senza tacca deve valere zero, non «non definito».
- Ogni altezza riservata si **misura** col browser, non si calcola a mente. Vale per la riserva della barra degli slot del Task 5.
- La nuvola è **facoltativa**: senza rete, senza binding o con D1 muto, il sito resta quello di oggi e nessun comando tocca lo stato locale.
- Il gate resta **offline**: nessun `wrangler`, nessuna rete. L'endpoint si prova con un finto `D1Database`.
- Ogni bersaglio da toccare è alto almeno **44px**. Verifica visiva sempre a **390×844**.
- Prima di dichiarare finito: `npm run gate` (check + test + build).
- Ogni task finisce con un commit.
- **Il merge su `develop` avviene dopo il controllo sul telefono**, non prima. Buona parte di queste correzioni vive in comportamenti che headless non riproduce.

---

### Task 1: la zona sicura si accende

Il fondamento: senza questo, tutti gli altri task non hanno effetto su iOS.
Tocca cinque file perché i tre numeri del cappello sono ripetuti a mano.

**Files:**

- Modify: `src/layouts/BaseLayout.astro`, `src/styles/tokens.css`, `src/components/Menu.astro`, `src/styles/base.css`, `src/styles/storia.css`, `src/styles/componenti.css`
- Test: `src/layouts/__tests__/BaseLayout.test.ts`, `src/styles/__tests__/altezze.test.ts`

**Interfaces:**

- Produces: `--tacca: env(safe-area-inset-top, 0px)` e `--cappello: calc(3.25rem + var(--tacca))` in `tokens.css`.
- Consumes: niente.

- [x] **Step 1: il test che fallisce** — in `BaseLayout.test.ts`, il meta `viewport` deve contenere `viewport-fit=cover`. In `altezze.test.ts`, `.barra` deve dichiarare la sua altezza come `var(--cappello)` e non come numero: è la guardia contro il ritorno del numero magico.
- [x] **Step 2: i due token** in `tokens.css`, con commento che dice perché `--cappello` esiste (quattro punti che devono muoversi insieme) e che senza `viewport-fit=cover` `--tacca` vale zero.
- [x] **Step 3: il meta** in `BaseLayout.astro:20` diventa `width=device-width, initial-scale=1, viewport-fit=cover`.
- [x] **Step 4: la barra del menu** (`Menu.astro:140`): `height: var(--cappello)` e `padding-top: var(--tacca)`. Il vetro sfocato copre così anche la striscia della tacca. `.barra[data-nascosta] { transform: translateY(-100%) }` continua a funzionare senza modifiche: la percentuale segue l'altezza nuova.
- [x] **Step 5: gli scarti che il cappello riserva**: `base.css:94` diventa `calc(var(--cappello) + 0.5rem)`, e `storia.css:11` lo stesso valore al posto di `3.75rem`. Oggi sono `3.75rem` = `3.25rem + 0.5rem`: il mezzo rem di respiro si conserva.
- [x] **Step 6: i due cappelli appiccicati** in `componenti.css` (`.barra-preparati-isola:987`, `.barra-slot-isola:1234`): `top: var(--cappello)`. **E i loro stati di barra ritirata**: cercare _entrambe_ le regole `top: 0` sotto `body:has(.barra[data-nascosta])` e portarle a `top: var(--tacca)`, altrimenti allo scroll il cappello di sezione scivola sotto l'orologio.
- [x] **Step 7: gli scarti laterali** sul `body` (`base.css`): `padding-inline` con `env(safe-area-inset-left/right, 0px)` sommati a `--spazio-2`. Trattare anche i due `body:has(...)` che oggi azzerano il `padding-inline` (la Storia) o tutto il padding (la splash): la Storia prende gli scarti laterali nudi, la splash resta a zero perché è lei a voler toccare i bordi.
- [x] **Step 8:** `npm run gate`, poi commit.

---

### Task 2: il colore della barra segue la rotta

**Files:**

- Modify: `src/layouts/BaseLayout.astro`, `src/pages/index.astro`
- Test: `src/layouts/__tests__/BaseLayout.test.ts`

**Interfaces:**

- Produces: prop `coloreTema?: string` su `BaseLayout`, valore di ripiego `#efe7d6`.
- Consumes: `--cappello` no; è indipendente dal Task 1 e può essere eseguito in qualunque ordine rispetto a quello.

- [x] **Step 1: i due test che falliscono** — senza la prop, `theme-color` resta `#efe7d6`; con `coloreTema: '#24282c'`, il meta porta quel valore. Una rotta sola cambia colore: il ripiego protegge le altre cinque.
- [x] **Step 2: la prop** in `BaseLayout.astro`, con il commento esistente sul `theme-color` **riscritto**: oggi dice «il valore è il colore di fondo della pagina in pergamena», e da qui in poi non è più vero per tutte le rotte. Deve dire che la home è una fotografia e porta il colore della fotografia, e che il lampeggio del colore navigando è accettato.
- [x] **Step 3:** `index.astro` passa `coloreTema="#24282c"` a `BaseLayout`. Il valore è misurato sui bordi di `kaelen-splash-mobile.webp`, non scelto a occhio: dirlo nel commento, altrimenti il prossimo che ritocca l'immagine non sa che questo numero la segue.
- [x] **Step 4:** `npm run gate`, poi commit.

---

### Task 3: la home a schermo pieno

Dipende dal Task 1: senza `viewport-fit=cover` niente di questo si vede.

**Files:**

- Modify: `src/pages/index.astro`

**Interfaces:**

- Consumes: `viewport-fit=cover` (Task 1).

- [x] **Step 1: l'immagine si misura sull'altezza grande.** `.splash` da `inset: 0` a `inset: 0 0 auto 0` con `height: 100vh` seguito da `height: 100lvh`. La doppia dichiarazione non è ridondanza: su iOS Safari `100vh` **è già** l'altezza grande, quindi vale da ripiego esatto dove `lvh` non arriva. `.lampo` e l'`img` sono dentro e la seguono senza modifiche.
- [x] **Step 2: le porte si misurano sull'altezza piccola.** `.porte` passa da `absolute` a `position: fixed`. Un elemento `fixed` con `bottom: 0` su iOS Safari sta **sopra** la barra URL: i due comandi non ci finiscono mai sotto, e in PWA scendono da soli al bordo perché lì le due altezze coincidono. Il `calc(2rem + env(safe-area-inset-bottom))` già scritto adesso vale davvero.
- [x] **Step 3: la trappola da controllare, non da dare per scontata.** `.splash` ha `overflow: hidden`: un figlio `fixed` non viene ritagliato perché `.splash` non crea un blocco contenitore (niente `transform`, `filter` o `will-change` su di lei — l'animazione `deriva` sta sull'`img`). Se la misura del Task 5 dovesse mostrare le porte tagliate, il ripiego è portare `.porte` fuori da `.splash` come sorella e sostituire il selettore `.splash.finita .porte` con `body:has(.splash.finita) .porte`. **Non fare il ripiego preventivamente.**
- [x] **Step 4: il desktop non regredisce.** La media query `min-width: 901px` riscrive `.porte` con `inset: 0 auto 0 0`: con `fixed` continua a valere, ma va guardata a 1440×900 prima di chiudere.
- [x] **Step 5:** `npm run gate`, poi commit.

---

### Task 4: l'app installata atterra sulla home

**Files:**

- Modify: `public/manifest.webmanifest`

- [x] **Step 1:** `start_url` da `/scheda/` a `/`, `background_color` da `#efe7d6` a `#24282c`. Lo `scope` resta `/`.
- [x] **Step 2:** `theme_color` del manifest **resta** `#efe7d6`: vale per l'app in generale, e cinque rotte su sei sono di pergamena. Quale dei due valori iOS usi per la barra di stato al lancio è incerto e si scopre solo installando: è una domanda per il controllo sul telefono, non da indovinare qui.
- [x] **Step 3: la home deve stare nel precache.** `scripts/build-sw.mjs` raccoglie per estensione dentro `dist/`, quindi `dist/index.html` dovrebbe già esserci: confermarlo sulla lista costruita, perché ora è la pagina d'avvio dell'app e una PWA che si apre offline su una pagina non memorizzata è una schermata bianca.
- [x] **Step 4:** `npm run gate`, poi commit.

---

### Task 5: Attacco e CD nello sticky degli incantesimi

Indipendente da tutti gli altri: si può eseguire in qualunque momento.

**Files:**

- Modify: `src/pages/scheda.astro`, `src/islands/BarraSlot.tsx`, `src/styles/componenti.css`
- Test: `src/styles/__tests__/altezze.test.ts`

- [x] **Step 1:** togliere `<p class="tenue attacco-inc">` da `scheda.astro:102` e portare i due valori **dentro `.barra-slot-isola`**, come markup statico accanto all'isola. Non dentro `BarraSlot.tsx`: è `client:only`, e un'isola non contiene mai contenuto statico. Rimuovere anche la regola `.attacco-inc` da `componenti.css`, che resta senza markup. **Scostamento:** la classe aveva un secondo uso (la nota sulle reazioni, `scheda.astro:167`), quindi non è rimasta senza markup: la regola è stata rinominata `.nota-sezione` per quell'uso, e `.attacco-inc` riscritta per il cappello.
- [x] **Step 2:** in `BarraSlot.tsx` il riassunto passa da «4 slot su 6» a `4/6`. La parola «slot» cade: dentro la sezione Incantesimi, accanto a `Attacco +5 · CD 13`, non può voler dire altro.
- [x] **Step 3:** disporre la riga: `Attacco +5 · CD 13` a sinistra, `4/6` e «dettaglio» a destra, dentro i 390px. Se stringe, la prima cosa che cade è «dettaglio».
- [x] **Step 4: rimisurare la riserva.** `.barra-slot-isola` dichiara `min-height: 49px`, un numero preso col browser: il contenuto della riga è cambiato, quindi va **misurato di nuovo** con CDP, non ricalcolato a mente. Aggiornare il test delle altezze. **Esito:** rimisurata in Chrome a 390x844, la riga chiusa è ancora 49px esatti — il numero resta, ma adesso il test lo dichiara invece di accettare qualunque cifra.
- [x] **Step 5:** `npm run gate`, poi commit.

---

### Task 6: i tre usi di Incanalare Divinità diventano un campo

Primo dei quattro task della segnalazione 3, che vanno in ordine: 6 → 7 → 8 → 9.

**Files:**

- Modify: `src/lib/schema.ts`, `src/content/character/kaelen.md`, `src/components/CapacitaEReazioni.astro`, `src/components/Capacita.astro`, `src/pages/personaggio.astro`
- Test: `src/lib/__tests__/schema.test.ts`

- [x] **Step 1: il test che fallisce** — una risorsa può portare `usi: [{ nome, nomeEn, paragrafi }]` (`paragrafi` e non `descrizione`: le tre voci ne avevano due a testa, e fonderli sarebbe stato riscrivere), e nessuna capacità ha più un titolo che comincia per `Incanalare Divinità: `.
- [x] **Step 2:** campo `usi` opzionale nello schema Zod, dentro `risorse`.
- [x] **Step 3:** spostare le tre voci in `kaelen.md` da `capacita` a `risorse[incanalare].usi`. Migrazione meccanica di dati, nessuna parola riscritta.
- [x] **Step 4:** `CapacitaEReazioni.astro` perde il `PREFISSO_INCANALARE` e lo `startsWith`, e legge il campo.
- [x] **Step 5: risarcire `/personaggio/`.** Quella pagina stampa `pg.capacita` e senza intervento **perde tre capacità in silenzio** — il tipo di regressione che nessuno nota per due sessioni. Ricostruire lì le tre voci dal campo nuovo.
- [x] **Step 6:** `npm run gate`, poi commit.

---

### Task 7: `risorseUsate` diventa una lista

Il cambio di forma che rende possibile l'annulla sulle capacità. È anche il
punto di non ritorno: `SCHEMA_VERSION` sale a 4.

**Files:**

- Modify: `src/lib/sheet-state.ts`, `src/islands/Contatori.tsx`, `src/islands/PannelloAzioni.tsx`, `src/lib/caselle.ts` se serve
- Test: `src/lib/__tests__/sheet-state.test.ts`, `src/lib/__tests__/sheet-version.test.ts`

**Interfaces:**

- Produces: `risorseUsate: Record<string, string[]>`, con lo stesso significato che `slotSpesi` ha per gli slot: chi ha speso, in ordine cronologico.

- [x] **Step 1: il test che fallisce** — uno stato v3 con `risorseUsate: { incanalare: 1 }` migra a v4 in una lista di un elemento, e la migrazione non perde il conteggio. Il segnaposto per «speso senza dire da cosa» è lo stesso già usato dagli slot: `SLOT_MANUALE` è stato rinominato `SPESA_MANUALE`, perché adesso le code sono due e il nome vecchio ne nominava una sola.
- [x] **Step 2:** cambiare il tipo e la migrazione, `SCHEMA_VERSION` da 3 a 4.
- [x] **Step 3: i tre consumatori.** `usaRisorsa`/`recuperaRisorsa` prendono e tolgono dalla coda; `riposoBreve` toglie **un** elemento alle risorse a recupero breve (la regola di oggi, che è giusta); `riposoLungo` svuota. `Contatori.tsx` legge `.length` dove leggeva il numero.
- [x] **Step 4:** `npm run gate`, poi commit.

---

### Task 8: l'annulla diventa condiviso

**Files:**

- Create: `src/lib/annulla.ts`, `src/islands/StrisciaAnnulla.tsx`
- Modify: `src/islands/ControlliLancio.tsx`, `src/pages/scheda.astro`
- Test: `src/lib/__tests__/annulla.test.ts`

**Interfaces:**

- Produces: un signal di modulo con l'ultima azione annullabile (`{ detto, costo, disfa }`) e `DURATA_ANNULLA`. Una striscia sola, montata una volta.

- [x] **Step 1: il test che fallisce** — due azioni annullabili di seguito lasciano **una** sola voce, la seconda, e annullare chiama la funzione di disfacimento di quella. È la regola già scritta a mano dentro `ControlliLancio` («si può annullare solo l'ultima azione, non un intero storico»), spostata dove si può provare senza DOM.
- [x] **Step 2:** estrarre da `ControlliLancio` il signal, il timer e il markup della striscia. Il CSS (`.striscia-annulla`, `.velo-annulla`) è già globale in `componenti.css` e non si muove.
- [x] **Step 3:** `ControlliLancio` dichiara l'azione invece di disegnarla; `scheda.astro` monta `StrisciaAnnulla` una volta sola.
- [x] **Step 4:** verificare che `DURATA_ANNULLA` resti **un numero solo**, passato al CSS come proprietà personalizzata: è la ragione per cui la barra e il diritto di annullare finiscono insieme.
- [x] **Step 5:** `npm run gate`, poi commit.

---

### Task 9: il consumo dalle card delle capacità

**Files:**

- Modify: `src/components/CapacitaEReazioni.astro`, `src/islands/Contatori.tsx`, `src/styles/componenti.css`
- Test: `src/islands/__tests__/Contatori.test.ts`, `src/components/__tests__/capacita-e-reazioni.test.ts`

- [x] **Step 1: Incanalare Divinità apre una modale**, gemella di quella di lancio: un blocco per uso al posto di un blocco per livello di slot, ognuno col suo testo e il suo bottone. Il contenuto statico resta statico — markup di build con un contenitore per uso dentro (`[data-uso]`, più `[data-spendi]` sulle card senza modale: un contenitore solo non bastava, ogni comando deve stare sotto il proprio testo), e l'isola ci disegna i comandi, esattamente come `[data-lancio]`.
- [x] **Step 2: Ira della Tempesta e Tuono della Tempesta si spendono con un tocco** dalla card, senza modale. Sono reazioni: si spendono nel turno di qualcun altro, e la scelta non esiste. L'errore lo copre la striscia del Task 8.
- [x] **Step 3: le caselle portano il sigillo** — sono tre glifi nuovi nello sprite, e `sigilli-usi.test.ts` verifica che ogni uso nei dati trovi il proprio: un `<use>` che punta a un simbolo assente non fallisce, mostra un riquadro vuoto.
- [x] **Step 3 (originale): le caselle portano il sigillo** di ciò che le ha spese, per Incanalare. Per le due reazioni il sigillo è sempre lo stesso e la casella resta piena e basta.
- [x] **Step 4: lo stato spento.** Una capacità a secco non offre il comando, come `cartaSpenta` fa per gli incantesimi.
- [x] **Step 5:** `npm run gate`, poi commit.

---

### Task 10: il ⚡ rifondato

Dipende dal Task 9: la potatura ha senso solo quando le risorse si spendono
dalle card.

**Files:**

- Modify: `src/islands/PannelloAzioni.tsx`, `src/styles/componenti.css`
- Test: `src/islands/__tests__/PannelloAzioni.test.ts`

- [x] **Step 1: la potatura.** Cancellare dal pannello tutto ciò che ha un'altra casa: danno/cura, PF temporanei, TS morte, dadi vita, ispirazione (tutti nella Vitalità), le righe «Usa» di slot e risorse (lancio e card). Restano **due griglie**, slot e risorse, con `−` e `↺`, sotto «Correzioni a mano», chiuse di default.
- [x] **Step 2: a tutto schermo**, nella lingua delle altre due modali: testa appiccicata, chiusura col tasto indietro, vetro sopra il velo. `dialog.azioni` perde la forma a foglio che sale dal basso.
- [x] **Step 3: i riposi diventano due blocchi con la conseguenza già calcolata** — «PF 21 → 27, 4 slot, 2 dadi vita, tutte le risorse» — e conferma dentro il pannello. Via `confirm()`: blocca il thread e non si può provare. Il riposo lungo continua a segnalare la preparazione dovuta e a portare all'archivio.
- [x] **Step 4: il bottone** da `1rem` a `1.5rem` dal bordo destro, e **nascosto su `/preparati/`** mentre la sessione di preparazione è aperta. **Scostamento:** la seconda metà non si applica — `PannelloAzioni` è montato solo da `scheda.astro`, e il ⚡ su `/preparati/` non c'è mai stato (verificato sulle sei rotte costruite).
- [x] **Step 5:** `npm run gate`, poi commit.

---

### Task 11: D1 e l'endpoint delle sessioni

**Files:**

- Create: `wrangler.jsonc`, `migrations/0001_sessioni.sql`, `functions/api/sessioni.ts`, `functions/api/sessioni/[id].ts`, `functions/__tests__/sessioni.test.ts`
- Modify: `.dev.vars.example`, `.env.example`, `CLAUDE.md`

**Le risorse, create sull'account il 2026-08-19:**

| ambiente   | database         | `database_id`                          |
| ---------- | ---------------- | -------------------------------------- |
| Production | `kaelen`         | `a90cff0d-ef6e-4bb0-9ece-b14cb955b5f4` |
| Preview    | `kaelen-preview` | `c269bb09-519a-49aa-b6c1-10509d990bf8` |

Due database e non uno perché la potatura tiene venti salvataggi: con un
database solo, un pomeriggio di prove dal ramo può buttare fuori una sessione
di gioco vera.

**Il binding si chiama `DB` in tutti e due gli ambienti.** Cambia il database
dietro, mai il nome davanti: `wrangler d1 create` suggerisce come binding il
nome del database, e prendere quel suggerimento alla lettera darebbe `kaelen`
in Production e `kaelen_preview` in Preview, costringendo la funzione a
indovinare in quale ambiente sta girando. Si imposta dalla dashboard
(Settings → Bindings), una volta per ambiente, e **entra in vigore solo al
deploy successivo**.

- [x] **Step 1: i test che falliscono**, con un finto `D1Database` in memoria — nessun `wrangler` nel gate. POST inserisce una riga e pota oltre la ventesima; GET elenca in ordine di data con i campi del riepilogo; DELETE toglie una riga; un corpo malformato è 400.
- [x] **Step 2: la tabella** come da spec (`id, creato_il, etichetta, nota, schema_v, sheet_v, stato`), in `migrations/`.
- [x] **Step 3: gli endpoint.** Niente autenticazione propria: il `_middleware.ts` fail-closed copre già `/api/`. Verificarlo con un test, perché è un'assunzione di sicurezza e non un dettaglio.
- [x] **Step 4: il `wrangler.jsonc` è solo per il locale.** Binding `DB`, `database_name: "kaelen"`, l'id di Production, e `preview_database_id: "DB"` che Pages richiede in locale. **Senza `pages_build_output_dir`**: quella chiave farebbe del file la fonte di verità del progetto, la dashboard smetterebbe di poter configurare quei campi, e un deploy porterebbe in produzione una configurazione scritta per lo sviluppo — dove ci sono anche `SITE_USER` e `SITE_PASS`.
- [x] **Step 5: le migrazioni si applicano a mano**, e prima del deploy: `wrangler d1 migrations apply kaelen --remote` (e `--local` per il database di sviluppo). Nessun hook le esegue: se il codice arriva in produzione prima della migrazione, l'endpoint trova la tabella che non c'è.
- [x] **Step 6: il binding manca in locale.** Documentare in `CLAUDE.md` come si gira con `wrangler pages dev` e la D1 locale, e che **senza binding gli endpoint devono rispondere un errore pulito**, non rompersi: il sito deve restare usabile offline e su un clone senza Cloudflare.
- [x] **Step 7:** `npm run gate`, poi commit.

---

### Task 12: il pannello nuvola dentro il ⚡

**Files:**

- Create: `src/lib/nuvola.ts`, `src/islands/Nuvola.tsx`
- Modify: `src/islands/PannelloAzioni.tsx`
- Test: `src/lib/__tests__/nuvola.test.ts`

- [x] **Step 1: i test che falliscono** su funzioni pure: il riepilogo di una riga («PF 21/27 · 4 slot · 1 Incan.») calcolato da uno stato; il confronto fra `sheet_v` salvata e corrente che marca «scheda precedente»; la decisione di cosa mostrare quando la rete non c'è.
- [x] **Step 2: «Salva adesso»** manda `stato.value` intero più l'etichetta breve digitata lì. La nota **non** si digita al salvataggio: è `stato.note`, la stessa di `/note/`, e la riga ne conserva una copia.
- [x] **Step 3: «Riprendi…»** apre l'elenco. Ogni riga porta data, etichetta, riepilogo, e il marchio «scheda precedente» dove `sheet_v` non combacia.
- [x] **Step 4: la doppia data e il salvataggio di cortesia.** Prima di sovrascrivere, il pannello mostra le due date affiancate e offre «salva prima di riprendere» con un tocco. Il ripristino passa da `carica()`, quindi la regola di `sheetVersion` vale identica: se la scheda è cambiata, azzera, e l'avviso è quello di sempre.
- [x] **Step 5: il fallimento è normale.** Nessuna rete, nessun binding, D1 muto: il comando dice che non è riuscito e **non tocca niente in locale**. La nuvola è un comando, non una sincronizzazione.
- [x] **Step 6: la nota nel pannello** scrive `stato.note` — un campo, non un secondo posto dove scrivere la stessa frase.
- [x] **Step 7:** `npm run gate`, poi commit.

---

### Task 13: la prova con gli inset simulati

Non produce codice del sito: produce la certezza che i quattro task
precedenti non abbiano rotto le altre cinque rotte.

**Files:**

- Nessuno nel repo. Lo script è usa e getta, nello scratchpad di sessione.

- [x] **Step 1:** build, poi servire `dist/` da **`localhost`** (non `127.0.0.1`), con il server avviato **dentro** la cartella e **riavviato dopo ogni build**. Vedi la memoria `browser-headless-via-cdp`: entrambe le trappole hanno già prodotto misure false su questo progetto.
- [x] **Step 2:** Chrome headless, `Network.setBypassServiceWorker {bypass: true}`, `Emulation.setDeviceMetricsOverride {width: 390, height: 844, mobile: true}` e `Emulation.setSafeAreaInsetsOverride` con alto 47 e basso 34. Ogni `Runtime.evaluate` in gara con un timeout.
- [x] **Step 3: cosa misurare**, su tutte e sei le rotte. Che `env(safe-area-inset-top)` arrivi diverso da zero (se resta zero, `viewport-fit=cover` non è arrivato e tutto il resto è teatro). Che la barra del menu sia alta 47px in più e che il suo contenuto stia sotto la tacca. Che i due cappelli appiccicati si fermino sotto la barra, nei due stati. Che nessuna barra fissa in basso finisca sotto i 34px di scarto. Che sulla home l'immagine sia alta quanto il viewport grande e le porte stiano **sopra** la linea dell'altezza piccola.
- [x] **Step 4:** riferire le misure. Se una non torna, si corregge e si rimisura: il gate verde non dice niente su queste.

**Le misure, prese il 2026-08-19 con Chrome headless, 390x844, inset alto 47 e
basso 34.**

| cosa                                  | atteso             | letto      |
| ------------------------------------- | ------------------ | ---------- |
| `env(safe-area-inset-top)`, sei rotte | 47                 | 47         |
| `--cappello`                          | 52 + 47 = 99       | 99         |
| barra del menu, altezza               | 99                 | 99         |
| contenuto della barra, dal bordo      | sotto 47           | 50         |
| cappelli appiccicati, barra visibile  | 99                 | 99         |
| cappelli appiccicati, barra ritirata  | 47                 | 47         |
| primo contenuto di `main`, in cima    | 99 + 8 = 107       | 107        |
| ⚡, dal fondo                         | oltre 34           | 50         |
| home, altezza della fotografia        | quanto il viewport | 844 su 844 |
| home, porte e link dal fondo          | oltre 34           | 66         |

La barra **si ritira da sola** allo scorrimento (`barra-scroll.ts`): la prima
misura degli sticky sembrava sbagliata a 47 e non lo era: era già l'altro
stato. Per leggere i due valori bisogna riportare la barra a mano senza
toccare lo scroll.

**In più, non richiesto dal piano ma toccato dal Task 1:** da telefono
coricato (844x390, inset laterali 47) lo scarto del `body` vale 63px — i 16 di
`--spazio-2` più i 47 dello schermo — e nessun testo entra nella tacca su
`/scheda/`, `/storia/` e `/note/`.

---

## Cosa resta all'occhio umano

Da fare sul telefono vero, prima del merge su `develop`:

- la tinta della barra di Safari sulla home e il passaggio di colore navigando verso la Scheda;
- l'immagine sotto la dynamic island in una scheda di Safari;
- la PWA **disinstallata e reinstallata** (`start_url` e `background_color` non cambiano da soli in un'app già installata): il lampo d'avvio, dove atterra, e la barra di stato. Chiude la verifica 3 rimasta in sospeso dal rilascio 1.1.0.
- **il salvataggio in nuvola da due dispositivi**: salvare da uno, riprendere dall'altro, e provare il caso brutto — riprendere un salvataggio di una scheda precedente e vedere che l'avviso arriva **prima**, non dopo.
- **il ⚡ potato al tavolo**: che non manchi niente durante una sessione vera. È la potatura più grossa di questo giro e l'unica prova che conta è una serata di gioco.
