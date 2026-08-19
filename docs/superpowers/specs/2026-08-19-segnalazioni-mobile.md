# Segnalazioni mobile — lo schermo pieno e la zona sicura

Elenco aperto, raccolto a voce il 2026-08-19. Una sezione per segnalazione,
nell'ordine in cui sono arrivate; il piano gemello
(`plans/2026-08-19-segnalazioni-mobile.md`) ha un task per sezione. Le
correzioni finiscono tutte sullo stesso ramo, `fix/segnalazioni-mobile`, un
commit ciascuna, e **l'implementazione non parte finché l'elenco non è
chiuso**: due segnalazioni che toccano lo stesso file vanno scritte insieme,
non una sopra l'altra.

---

## Segnalazione 1 — la home non arriva ai bordi su Safari iOS

> «Vorrei che l'immagine fosse anche sotto gli input url di Safari, sia sotto
> che sopra dove c'è la dynamic island. Un vero full screen; se non si riesce,
> almeno un colore di sfondo che dia l'illusione di continuità.»

### Cosa si vede oggi

La splash apre una fotografia notturna che si ferma prima dei bordi dello
schermo. Sopra, la striscia della dynamic island resta fuori. Sotto, la barra
degli indirizzi di Safari le sta attaccata, **beige**, perché il sito dichiara
un `theme-color` di pergamena valido per tutte e sei le rotte. Il risultato è
una fotografia incorniciata da due strisce che non c'entrano niente con lei.

### Perché, in tre punti

1. **`viewport-fit=cover` non c'è.** Il meta in
   `src/layouts/BaseLayout.astro:20` è `width=device-width, initial-scale=1` e
   basta. Senza quel terzo valore iOS tiene il documento dentro la zona
   sicura, e nessuna immagine può arrivare al bordo fisico.
2. **Gli otto `env(safe-area-inset-*)` del progetto valgono zero.** Sono già
   scritti — menu, pulsante ⚡, barra di preparazione, tre modali, e le porte
   della splash stessa — e aspettano da sempre il flag del punto 1. È codice
   morto che non è mai stato acceso.
3. **`theme-color` è `#efe7d6` per tutti.** Sulle cinque rotte di pergamena è
   il colore giusto. Sulla home è il colore sbagliato, e la barra URL è la
   superficie più grande che il difetto tocca.

### Il limite da dire subito

**In una scheda di Safari la barra degli indirizzi non si toglie e non si
riempie di immagine.** È cromo del browser. Quello che si può fare è tre cose:
far passare l'immagine sotto la status bar in alto, portarla fino al bordo
fisico in basso, tingere le barre del colore dell'immagine. Il full screen
senza barre esiste solo nella PWA installata, ed è il motivo per cui questa
segnalazione tocca anche il manifest.

### Le decisioni

Il colore `#24282c` non è scelto a occhio: è la media del bordo alto **e** del
bordo basso di `src/assets/kaelen-splash-mobile.webp`, che coincidono.

| #   | decisione                                                              | perché                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `viewport-fit=cover` **globale**, non solo sulla home                  | è ciò per cui gli otto `env()` erano stati scritti; tenerlo spento è l'anomalia, e sui telefoni con la tacca le barre fisse in basso smettono di finirci sotto                                              |
| 2   | immagine della splash alta `100lvh` invece di `inset: 0`               | `lvh` è l'altezza con il cromo ritratto: sotto non resta mai una striscia vuota quando Safari muove la barra                                                                                                |
| 3   | le porte («Scheda», «Storia») restano ancorate all'altezza **piccola** | un elemento `fixed` con `bottom: 0` su iOS sta **sopra** la barra URL: stessa regola, due risultati giusti, e in PWA le porte scendono da sole al bordo vero perché lì `svh` e `lvh` coincidono             |
| 4   | `theme-color` **per rotta**: `#24282c` sulla home, pergamena altrove   | la home è una fotografia, le altre sono fogli di carta; fingere che siano la stessa cosa peggiora entrambe. Il prezzo accettato è che la barra di Safari cambi colore navigando dalla home alla Scheda      |
| 5   | la barra del menu si allunga **dentro** la zona della tacca            | una barra che si ferma sotto la tacca disegna una riga orizzontale che nessuno ha ordinato; il vetro che ci passa sotto è il modo in cui iOS si aspetta che si comporti un cappello appiccicato             |
| 6   | scarti laterali (`safe-area-inset-left/right`) sul `body`              | il telefono coricato, una riga di CSS                                                                                                                                                                       |
| 7   | `start_url` del manifest da `/scheda/` a `/`                           | la PWA installata è bersaglio della correzione, ed è l'unico posto dove il full screen è letterale. Costo accettato: un tocco in più a ogni lancio, perché la splash chiede comunque di scegliere una porta |
| 8   | `background_color` del manifest da `#efe7d6` a `#24282c`               | è il fondo che iOS mostra **prima** che la pagina carichi: ora che l'app atterra sulla home, un lampo beige prima di una fotografia notturna sarebbe un difetto nuovo                                       |
| 9   | la status bar dell'app installata **non** si tocca                     | vedi sotto                                                                                                                                                                                                  |

### Cosa questa correzione non dà

Si è deciso di **non** mettere `apple-mobile-web-app-status-bar-style:
black-translucent`. Con quello l'immagine passerebbe davvero **sotto
l'orologio** nell'app installata, ma la scelta vale per tutta l'app e non per
pagina: sulle altre cinque rotte l'orologio diventerebbe bianco sopra la
pergamena chiara, cioè illeggibile, a meno di mettere una fascia scura in cima
a pagine che scure non sono.

Quindi, nero su bianco: **nella PWA la dynamic island resterà una fascia opaca
tinta `#24282c`, non l'immagine che ci scorre sotto.** È l'illusione di
continuità messa come ripiego accettabile nella segnalazione, non il full
screen letterale. Il guadagno vero è l'intera barra URL di Safari, che è la
fetta grossa, più la continuità di colore ovunque.

Resta anche fuori, e non è un difetto: dal menu non si torna a `/`. È una
domanda di progetto aperta da prima, e diventa una segnalazione solo se la si
chiede.

### La conseguenza obbligata: il cromo sotto la tacca

Accendere `viewport-fit=cover` su tutte le rotte sposta il problema in cima
alle altre cinque. Vanno corretti nello stesso giro, altrimenti la correzione
della home ne rompe cinque:

- `.barra` del menu (`src/components/Menu.astro:140`), `fixed` in cima, alta
  `3.25rem` senza alcuno scarto di sicurezza;
- lo scarto che `main` le riserva (`src/styles/base.css:94`, `3.75rem`) e il
  gemello della Storia (`src/styles/storia.css:11`);
- i due cappelli appiccicati a `top: 3.25rem` (`.barra-slot-isola`,
  `.barra-preparati-isola`), **compreso** il loro stato `top: 0` di quando la
  barra del menu si ritira allo scroll.

Quei tre numeri sono oggi ripetuti a mano in quattro punti. Diventano un token
solo, così la prossima persona non ne dimentica uno.

### Come si verifica

Il Chrome installato su questa macchina è la 151 e il suo CDP espone
**`Emulation.setSafeAreaInsetsOverride`**: gli `env()` che accendiamo si
possono **misurare** headless su tutte e sei le rotte a 390×844 con inset da
iPhone (alto 47, basso 34), non solo sperare che vadano. Vedi la memoria
`browser-headless-via-cdp` per le cinque trappole già costate misure false.

Quello che headless **non** vede, e resta occhio umano sul telefono: la tinta
vera della barra di Safari, la dynamic island, e la status bar della PWA
reinstallata. Il merge su `develop` avviene **dopo** quel controllo, non
prima. Chiude anche la verifica 3 rimasta in sospeso dal rilascio 1.1.0, che
era esattamente «il `theme-color` va guardato da PWA installata».

---

## Segnalazione 2 — Attacco e CD spariscono con lo scroll

> «Nella scheda, nella sezione incantesimi, Attacco +5 e CD 13 spariscono
> velocemente: aggiungere nello sticky dedicato, riducendo a 6/6 la dicitura
> degli slot.»

`scheda.astro:102` mette `Attacco +5 · CD 13` in un paragrafo **sopra** la
barra appiccicata. Due righe di scroll e i due numeri che servono a ogni
lancio sono fuori schermo, mentre la barra che resta in vista porta solo il
conto degli slot.

### Le decisioni

**I due numeri vanno nel contenitore, non nell'isola.** `BarraSlot.tsx` è
`client:only`, e il vincolo del progetto dice che un'isola non contiene mai
contenuto statico. `Attacco` e `CD` sono valori derivati in build da
`derive.ts`: entrano in `.barra-slot-isola`, che è markup scritto dal build,
sulla stessa riga dell'isola. Si vedono così anche prima dell'idratazione, che
per due numeri immutabili è il comportamento giusto.

**La riga si legge `Attacco +5 · CD 13` a sinistra, `6/6` più «dettaglio» a
destra.** La parola «slot» cade: serviva a «4 slot su 6», che doveva
spiegarsi da sola; accanto a `Attacco +5 · CD 13`, dentro la sezione
Incantesimi, `6/6` non può voler dire altro. Se a 390px la riga stringe, la
prima cosa che cade è «dettaglio», non «Attacco».

**`CD` resta anche nella fascia in alto.** È l'unica duplicazione che questo
giro di correzioni **non** toglie, e per una ragione: la fascia `CA · CD ·
INIZ` è l'identità difensiva del personaggio, si guarda quando ti colpiscono;
lo sticky è lo strumento della sezione, si guarda quando lanci. Il numero è
statico, quindi le due copie non possono divergere.

**Conseguenza da misurare:** `.barra-slot-isola` riserva `min-height: 49px`,
un numero preso col browser. La riga cambia contenuto, quindi la riserva va
rimisurata, non ricalcolata a mente.

---

## Segnalazione 3 — il consumo dove sta la capacità

> «Sulla base del refactor fatto ad attacchi e incantesimi, proponimi un
> refactor per capacità e reazioni.»

Oggi le card delle capacità (`CapacitaEReazioni.astro`) mostrano il contatore
e non lo toccano: `Contatori.tsx` è dichiaratamente di sola lettura, e per
spendere una carica si apre il ⚡ e si cerca la riga giusta. È la stessa
distanza fra il gesto e il numero che il rifacimento degli incantesimi ha già
chiuso una volta.

### Il modello

Sugli incantesimi la card è muta e la modale offre **le scelte**, ognuna con
la conseguenza già calcolata. Applicato alle capacità di Kaelen, questo divide
in due:

**Incanalare Divinità → modale, come un incantesimo.** Ha tre usi (Scintilla
Divina, Scacciare Non Morti, Ira Distruttiva) sulle stesse due cariche: la
scelta esiste, e la modale è il gemello esatto di quella di lancio, con un
blocco per uso al posto di un blocco per livello di slot.

**Ira della Tempesta e Tuono della Tempesta → un tocco dalla card.** Sono
reazioni: si spendono nel turno di qualcun altro, mentre il tavolo aspetta, e
hanno un modo solo di spendersi. Una modale che chiede conferma per una scelta
che non esiste è una tassa su ogni innesco. L'errore lo copre la striscia di
annullamento a 5 secondi, che è già scritta.

### Le tre conseguenze strutturali

**1. `risorseUsate` diventa una lista, come `slotSpesi`.** Oggi è
`Record<string, number>`: un conteggio non sa dire _cosa_ ha speso la carica,
e soprattutto non sa dire qual è stata **l'ultima**, che è ciò che serve per
annullare. Diventa `Record<string, string[]>`, con lo stesso significato che
ha per gli slot, e le caselle di Incanalare portano il sigillo dell'uso che le
ha spese. Costo: `SCHEMA_VERSION` da 3 a 4 con migrazione, e un cambio di
forma che tocca `Contatori`, i due riposi, il ⚡ e i loro test. Deciso come
aut-aut: o questo **con** l'annulla, o si resta al numero **senza** annulla.

**2. I tre usi di Incanalare diventano un campo vero.** Oggi vivono in
`pg.capacita` come voci col titolo prefissato `Incanalare Divinità: `, e la
card li ritrova con uno `startsWith` su una stringa italiana. Come chiave di
un comando che spende risorse è una trappola che scatta il giorno in cui
qualcuno rinomina la capacità: diventano `usi: [{ nome, nomeEn, descrizione }]`
dentro la risorsa, nello schema Zod. **`/personaggio/` va risarcita**: legge
`pg.capacita` e senza intervento perderebbe tre capacità in silenzio.

**3. L'annulla si estrae.** La striscia a 5 secondi vive dentro
`ControlliLancio` ed è scritta sugli incantesimi. Due isole che disegnano
ciascuna la propria striscia potrebbero mostrarne due insieme: diventa un
modulo solo, con un signal dell'ultima azione annullabile e una striscia sola
montata una volta. Chi spende dichiara cosa ha speso e come si disfa.

---

## Segnalazione 4 — il ⚡ rifondato: sessione, riposi, nuvola

> «Ristrutturare drawer con fulmine, controlla cosa è doppione, non
> rimuoviamolo ma va migliorato nello stile. Deve essere un workaround diretto
> in caso di corner case. Proponimi uno sketch per gestire i riposi e la
> sessione, e la possibilità di salvare in remoto.»

### Il censimento: il ⚡ è quasi tutto doppione

| cosa c'è oggi nel ⚡        | chi altro lo fa già                                       |
| --------------------------- | --------------------------------------------------------- |
| −1/−5, Danno, Cura          | la modale **Vitalità** (rotella)                          |
| PF temporanei, TS morte     | la modale **Vitalità**                                    |
| Dadi vita col totale tirato | la modale **Vitalità**                                    |
| Ispirazione Eroica          | la modale **Vitalità**, la stella                         |
| Slot per livello: Usa / ↺   | **BarraSlot** (lettura) + la modale di **lancio** (spesa) |
| Risorse: Usa / ↺            | **Contatori** (lettura) + le card, dopo la segnalazione 3 |
| **Riposo breve / lungo**    | **nessuno.** È l'unica cosa che vive solo lì              |

Il pannello non va ristrutturato: va **rifondato su ciò che gli resta**. Il
governo della sessione (riposi, salvataggio, note) più una cassetta degli
attrezzi per i corner case.

### La forma

A tutto schermo, nella stessa lingua delle modali di lancio e Vitalità: testa
appiccicata, chiusura col tasto indietro, vetro sopra il velo.

```
┌──────────────────────────────────┐
│  Sessione                 Chiudi │
├──────────────────────────────────┤
│  RIPOSI                          │
│  ┌──────────────┐┌──────────────┐│
│  │   ⏱ Breve    ││   🌙 Lungo   ││
│  │ +1 Incanalare││ tutto, e i   ││
│  │              ││ sei preparati││
│  └──────────────┘└──────────────┘│
│                                  │
│  NUVOLA                          │
│  ultimo salvataggio              │
│  ieri 23:14 · «il molo di Thuun» │
│  ┌──────────────┐┌──────────────┐│
│  │ Salva adesso ││  Riprendi…   ││
│  └──────────────┘└──────────────┘│
│                                  │
│  NOTA DI QUESTA SESSIONE         │
│  ┌────────────────────────────┐  │
│  │ Il capitano mente sul...   │  │
│  └────────────────────────────┘  │
│                                  │
│  ▸ Correzioni a mano             │
│    slot · risorse                │
└──────────────────────────────────┘
                        ( ⚡ )
```

**Il bottone** resta in basso a destra e si scosta dal bordo: da `1rem` a
`1.5rem`. Sparisce su `/preparati/` mentre la sessione di preparazione è
aperta, dove le uniche azioni legittime sono Annulla e Conferma.

**I riposi non usano più `confirm()`.** Diventano due blocchi che dicono cosa
recupererai **coi tuoi numeri** («PF 21 → 27, 4 slot, 2 dadi vita, tutte le
risorse») e poi confermano: la stessa lingua della modale di lancio, dove ogni
scelta mostra la conseguenza già applicata invece della formula. `confirm()`
per giunta blocca il thread e non si può provare.

**La cassetta «Correzioni a mano»** contiene due sole griglie, slot per
livello e risorse, ognuna con `−` e `↺`. Tutto il resto del pannello di oggi
viene cancellato: ha un'altra casa. Sparisce anche l'unico posto dove oggi si
digita un numero di danno a mano, ed è voluto, perché era il secondo cruscotto
divergente.

### La nuvola

```
┌──────────────────────────────────┐
│  Riprendi una sessione   Indietro│
├──────────────────────────────────┤
│  ● 19 ago · 23:14                │
│    «il molo di Thuunvar»         │
│    PF 21/27 · 4 slot · 1 Incan.  │
│  ────────────────────────────────│
│  ○ 12 ago · 01:02  scheda prec.  │
│    «la nave dei Vaerak»          │
│    PF 27/27 · 6 slot · 2 Incan.  │
└──────────────────────────────────┘
```

**Il servizio è D1**, il database SQLite gestito di Cloudflare. Numeri dai
documenti Cloudflare, non a memoria:

|           | D1 gratis                  | KV gratis                   |
| --------- | -------------------------- | --------------------------- |
| scritture | **100.000 righe / giorno** | **1.000 chiavi / giorno**   |
| letture   | 5 milioni righe / giorno   | 100.000 / giorno            |
| spazio    | 5 GB                       | 1 GB                        |
| coerenza  | **immediata**              | **eventuale** (fino a ~60s) |

La coerenza è la ragione vera, non le quote: con KV si salva dall'iPad, si
apre l'iPhone dieci secondi dopo e si può ricevere la versione **precedente**.
Per un salvataggio di sessione è il difetto peggiore possibile. E un elenco di
sessioni con le sue note è letteralmente una tabella.

**L'autenticazione esiste già.** Il `functions/_middleware.ts` di Basic auth è
fail-closed e copre ogni rotta, `/api/` compresa: niente login, niente token,
niente modello utente. Il sito ha un utente solo e un personaggio solo.

```
functions/api/sessioni.ts        GET elenco · POST salva
functions/api/sessioni/[id].ts   GET una · DELETE

CREATE TABLE sessioni (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  creato_il TEXT NOT NULL,     -- ISO
  etichetta TEXT,              -- «il molo di Thuunvar»
  nota      TEXT,              -- copia di stato.note al momento del salvataggio
  schema_v  INTEGER NOT NULL,  -- SCHEMA_VERSION
  sheet_v   TEXT NOT NULL,     -- sheetVersion
  stato     TEXT NOT NULL      -- StatoSessione, JSON
);
```

Il client manda `stato.value` così com'è: `StatoSessione` è già piatto,
serializzabile e versionato, e `carica()` sa già migrare. Al ripristino si
riusa quella stessa funzione, quindi un salvataggio di due versioni fa si apre
lo stesso.

### Le regole della nuvola

**Facoltativa.** È la prima dipendenza da un servizio esterno in un progetto
finora statico e offline-first. Se D1 non risponde, o si è senza rete, tutto
continua a funzionare in locale come oggi e il comando dice soltanto che non è
riuscito. Il locale resta la verità: la nuvola è un comando, non una
sincronizzazione.

**Venti salvataggi, poi si pota.** Un archivio che cresce per sempre è un
archivio che nessuno rilegge. Dall'elenco si può anche eliminare a mano.

**Il ripristino chiede prima.** Sovrascrive lo stato del dispositivo: il
pannello mostra **le due date affiancate** («questo dispositivo: oggi 21:40 ·
il salvataggio: ieri 23:14») e offre «salva prima di riprendere» con un tocco.
Chi riprende il salvataggio sbagliato al tavolo perde una serata di gioco, e
il rimedio deve costare un tocco prima, non un rimpianto dopo.

**La regola di `sheetVersion` non ha eccezioni.** Se la scheda è cambiata,
`carica()` azzera, come già fa in locale. L'elenco **marca** quei salvataggi
(«scheda precedente») e avvisa prima, invece di lasciare scoprire
l'azzeramento dopo. La riga porta `sheet_v`, quindi il confronto è gratuito.

**La nota è una sola.** Il campo dentro il ⚡ scrive `stato.note`, la stessa di
`/note/`; il salvataggio ne congela una **copia** nella riga. Così il diario
conserva quello che avevi scritto allora, e non nasce un secondo posto dove
scrivere la stessa frase. L'unica cosa che si digita al momento di salvare è
l'etichetta breve, che è un titolo.

**Il nome del dispositivo non si registra.** Era nel primo mockup, è stato
tolto: nessuna API di browser lo dà in modo affidabile, indovinarlo dallo user
agent dà «iPhone» anche all'iPad, e non interessa saperlo.

**Il gate resta offline.** L'endpoint si prova con un finto `D1Database` in
memoria, come `basic-auth.test.ts` prova il middleware. Nessun `wrangler` nel
gate: un gate che ha bisogno della rete è un gate che prima o poi si salta. La
prova vera contro D1 si fa a mano sul deploy di preview.
