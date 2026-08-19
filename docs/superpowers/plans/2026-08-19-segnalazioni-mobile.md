# Segnalazioni mobile — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Far arrivare la home al bordo fisico dello schermo su Safari iOS e nella PWA installata, accendendo per la prima volta la zona sicura su tutto il sito.

**Architecture:** Nessun JavaScript nuovo, nessuna isola nuova. Tre leve: un valore in più nel meta `viewport`, due token che portano la tacca dentro le altezze già esistenti, un `theme-color` che diventa proprietà del layout invece che costante. La splash smette di misurarsi su `inset: 0` e si misura su `lvh`, mentre i suoi comandi restano ancorati all'altezza piccola.

**Tech Stack:** Astro 7 statico, CSS a mano con i token di `tokens.css`, vitest + jsdom, Chrome 151 via CDP per la prova con gli inset simulati.

**Spec:** `docs/superpowers/specs/2026-08-19-segnalazioni-mobile.md`

## Stato

**Elenco aperto.** Questo piano copre la segnalazione 1 e la sua conseguenza
obbligata sul cromo. Le segnalazioni successive aggiungono task in coda, e
l'esecuzione parte solo quando l'elenco è dichiarato chiuso: due segnalazioni
che toccano `BaseLayout.astro` vanno scritte in un colpo, non una sopra
l'altra.

## Global Constraints

- Tutta la prosa visibile e i commenti sono **in italiano**; i soggetti dei commit in inglese.
- HTML statico: il JavaScript è un'eccezione che deve chiedere permesso. **Questo piano non ne aggiunge.**
- Nessun numero magico nuovo: `3.25rem` e `3.75rem` sono già ripetuti in quattro punti e in questo piano diventano un token solo.
- Ogni `env()` porta il suo valore di ripiego (`env(safe-area-inset-top, 0px)`): su desktop e su Android senza tacca deve valere zero, non «non definito».
- Verifica visiva sempre a **390×844**.
- Prima di dichiarare finito: `npm run gate` (check + test + build).
- Ogni task finisce con un commit.
- **Il merge su `develop` avviene dopo il controllo sul telefono**, non prima. Metà di questa correzione vive in comportamenti che headless non riproduce.

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

- [ ] **Step 1: il test che fallisce** — in `BaseLayout.test.ts`, il meta `viewport` deve contenere `viewport-fit=cover`. In `altezze.test.ts`, `.barra` deve dichiarare la sua altezza come `var(--cappello)` e non come numero: è la guardia contro il ritorno del numero magico.
- [ ] **Step 2: i due token** in `tokens.css`, con commento che dice perché `--cappello` esiste (quattro punti che devono muoversi insieme) e che senza `viewport-fit=cover` `--tacca` vale zero.
- [ ] **Step 3: il meta** in `BaseLayout.astro:20` diventa `width=device-width, initial-scale=1, viewport-fit=cover`.
- [ ] **Step 4: la barra del menu** (`Menu.astro:140`): `height: var(--cappello)` e `padding-top: var(--tacca)`. Il vetro sfocato copre così anche la striscia della tacca. `.barra[data-nascosta] { transform: translateY(-100%) }` continua a funzionare senza modifiche: la percentuale segue l'altezza nuova.
- [ ] **Step 5: gli scarti che il cappello riserva**: `base.css:94` diventa `calc(var(--cappello) + 0.5rem)`, e `storia.css:11` lo stesso valore al posto di `3.75rem`. Oggi sono `3.75rem` = `3.25rem + 0.5rem`: il mezzo rem di respiro si conserva.
- [ ] **Step 6: i due cappelli appiccicati** in `componenti.css` (`.barra-preparati-isola:987`, `.barra-slot-isola:1234`): `top: var(--cappello)`. **E i loro stati di barra ritirata**: cercare _entrambe_ le regole `top: 0` sotto `body:has(.barra[data-nascosta])` e portarle a `top: var(--tacca)`, altrimenti allo scroll il cappello di sezione scivola sotto l'orologio.
- [ ] **Step 7: gli scarti laterali** sul `body` (`base.css`): `padding-inline` con `env(safe-area-inset-left/right, 0px)` sommati a `--spazio-2`. Trattare anche i due `body:has(...)` che oggi azzerano il `padding-inline` (la Storia) o tutto il padding (la splash): la Storia prende gli scarti laterali nudi, la splash resta a zero perché è lei a voler toccare i bordi.
- [ ] **Step 8:** `npm run gate`, poi commit.

---

### Task 2: il colore della barra segue la rotta

**Files:**

- Modify: `src/layouts/BaseLayout.astro`, `src/pages/index.astro`
- Test: `src/layouts/__tests__/BaseLayout.test.ts`

**Interfaces:**

- Produces: prop `coloreTema?: string` su `BaseLayout`, valore di ripiego `#efe7d6`.
- Consumes: `--cappello` no; è indipendente dal Task 1 e può essere eseguito in qualunque ordine rispetto a quello.

- [ ] **Step 1: i due test che falliscono** — senza la prop, `theme-color` resta `#efe7d6`; con `coloreTema: '#24282c'`, il meta porta quel valore. Una rotta sola cambia colore: il ripiego protegge le altre cinque.
- [ ] **Step 2: la prop** in `BaseLayout.astro`, con il commento esistente sul `theme-color` **riscritto**: oggi dice «il valore è il colore di fondo della pagina in pergamena», e da qui in poi non è più vero per tutte le rotte. Deve dire che la home è una fotografia e porta il colore della fotografia, e che il lampeggio del colore navigando è accettato.
- [ ] **Step 3:** `index.astro` passa `coloreTema="#24282c"` a `BaseLayout`. Il valore è misurato sui bordi di `kaelen-splash-mobile.webp`, non scelto a occhio: dirlo nel commento, altrimenti il prossimo che ritocca l'immagine non sa che questo numero la segue.
- [ ] **Step 4:** `npm run gate`, poi commit.

---

### Task 3: la home a schermo pieno

Dipende dal Task 1: senza `viewport-fit=cover` niente di questo si vede.

**Files:**

- Modify: `src/pages/index.astro`

**Interfaces:**

- Consumes: `viewport-fit=cover` (Task 1).

- [ ] **Step 1: l'immagine si misura sull'altezza grande.** `.splash` da `inset: 0` a `inset: 0 0 auto 0` con `height: 100vh` seguito da `height: 100lvh`. La doppia dichiarazione non è ridondanza: su iOS Safari `100vh` **è già** l'altezza grande, quindi vale da ripiego esatto dove `lvh` non arriva. `.lampo` e l'`img` sono dentro e la seguono senza modifiche.
- [ ] **Step 2: le porte si misurano sull'altezza piccola.** `.porte` passa da `absolute` a `position: fixed`. Un elemento `fixed` con `bottom: 0` su iOS Safari sta **sopra** la barra URL: i due comandi non ci finiscono mai sotto, e in PWA scendono da soli al bordo perché lì le due altezze coincidono. Il `calc(2rem + env(safe-area-inset-bottom))` già scritto adesso vale davvero.
- [ ] **Step 3: la trappola da controllare, non da dare per scontata.** `.splash` ha `overflow: hidden`: un figlio `fixed` non viene ritagliato perché `.splash` non crea un blocco contenitore (niente `transform`, `filter` o `will-change` su di lei — l'animazione `deriva` sta sull'`img`). Se la misura del Task 5 dovesse mostrare le porte tagliate, il ripiego è portare `.porte` fuori da `.splash` come sorella e sostituire il selettore `.splash.finita .porte` con `body:has(.splash.finita) .porte`. **Non fare il ripiego preventivamente.**
- [ ] **Step 4: il desktop non regredisce.** La media query `min-width: 901px` riscrive `.porte` con `inset: 0 auto 0 0`: con `fixed` continua a valere, ma va guardata a 1440×900 prima di chiudere.
- [ ] **Step 5:** `npm run gate`, poi commit.

---

### Task 4: l'app installata atterra sulla home

**Files:**

- Modify: `public/manifest.webmanifest`

- [ ] **Step 1:** `start_url` da `/scheda/` a `/`, `background_color` da `#efe7d6` a `#24282c`. Lo `scope` resta `/`.
- [ ] **Step 2:** `theme_color` del manifest **resta** `#efe7d6`: vale per l'app in generale, e cinque rotte su sei sono di pergamena. Quale dei due valori iOS usi per la barra di stato al lancio è incerto e si scopre solo installando: è una domanda per il controllo sul telefono, non da indovinare qui.
- [ ] **Step 3: la home deve stare nel precache.** `scripts/build-sw.mjs` raccoglie per estensione dentro `dist/`, quindi `dist/index.html` dovrebbe già esserci: confermarlo sulla lista costruita, perché ora è la pagina d'avvio dell'app e una PWA che si apre offline su una pagina non memorizzata è una schermata bianca.
- [ ] **Step 4:** `npm run gate`, poi commit.

---

### Task 5: la prova con gli inset simulati

Non produce codice del sito: produce la certezza che i quattro task
precedenti non abbiano rotto le altre cinque rotte.

**Files:**

- Nessuno nel repo. Lo script è usa e getta, nello scratchpad di sessione.

- [ ] **Step 1:** build, poi servire `dist/` da **`localhost`** (non `127.0.0.1`), con il server avviato **dentro** la cartella e **riavviato dopo ogni build**. Vedi la memoria `browser-headless-via-cdp`: entrambe le trappole hanno già prodotto misure false su questo progetto.
- [ ] **Step 2:** Chrome headless, `Network.setBypassServiceWorker {bypass: true}`, `Emulation.setDeviceMetricsOverride {width: 390, height: 844, mobile: true}` e `Emulation.setSafeAreaInsetsOverride` con alto 47 e basso 34. Ogni `Runtime.evaluate` in gara con un timeout.
- [ ] **Step 3: cosa misurare**, su tutte e sei le rotte. Che `env(safe-area-inset-top)` arrivi diverso da zero (se resta zero, `viewport-fit=cover` non è arrivato e tutto il resto è teatro). Che la barra del menu sia alta 47px in più e che il suo contenuto stia sotto la tacca. Che i due cappelli appiccicati si fermino sotto la barra, nei due stati. Che nessuna barra fissa in basso finisca sotto i 34px di scarto. Che sulla home l'immagine sia alta quanto il viewport grande e le porte stiano **sopra** la linea dell'altezza piccola.
- [ ] **Step 4:** riferire le misure. Se una non torna, si corregge e si rimisura: il gate verde non dice niente su queste.

---

## Cosa resta all'occhio umano

Da fare sul telefono vero, prima del merge su `develop`:

- la tinta della barra di Safari sulla home e il passaggio di colore navigando verso la Scheda;
- l'immagine sotto la dynamic island in una scheda di Safari;
- la PWA **disinstallata e reinstallata** (`start_url` e `background_color` non cambiano da soli in un'app già installata): il lampo d'avvio, dove atterra, e la barra di stato. Chiude la verifica 3 rimasta in sospeso dal rilascio 1.1.0.
