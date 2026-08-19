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

## Segnalazioni successive

Da scrivere. L'elenco è aperto.
