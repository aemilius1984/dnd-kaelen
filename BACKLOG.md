# Backlog

Cose decise, non fatte, e il perché. Una voce esce di qui solo con il suo giro
di domande: niente entra in un ramo "già che ci siamo".

## Tema scuro grafite

Un secondo tema sul modello di potenza.dev — grafite, accento schiarito per il
contrasto. Sostituisce Tempesta, che non è piaciuto. Fuori dal ridisegno perché
un tema buio fatto bene raddoppia ogni verifica visiva, e la faccia chiara è
appena cambiata.

## Tema Tempesta

Spento il 2026-08-17. I token `:root[data-tema='tempesta']` in `tokens.css` e
tutto `src/lib/tema.ts` sono rimasti al loro posto: riaccenderlo è il revert del
commit che l'ha nascosto, non una riscrittura. Probabilmente non si riaccende —
il posto del tema scuro lo prende il grafite qui sopra.

## Glossario "Actions in Combat"

Le 15 azioni standard delle regole 2024 (Attack, Dash, Disengage, Dodge,
Grapple, Help, Hide, Improvise, Influence, Magic, Ready, Search, Shove, Study,
Utilize), blocco richiudibile in fondo alla Scheda, in doppia lingua. È
contenuto nuovo da scrivere, non ridisegno.

## Condizioni attive

Tracciare Prone, Grappled, Frightened e simili nello stato di sessione. È una
funzionalità a sé: merita le sue domande, non una riga in coda a un altro ramo.

## Altezze riservate da ri-misurare a 390px

La rinomina dei token di spaziatura ha portato la larghezza di contenuto di
riferimento da 340px a 324px (vedi la derivazione in `.risorse-isola`,
`src/styles/componenti.css`). Quattro `min-height` in quel file erano
calibrate sui 340px vecchi e ora sotto-riservano di una quantità che nessuna
sessione senza browser può calcolare con sicurezza — dipende da dove
avvengono gli a-capo nel testo reale, non da un'aritmetica semplice come per
`.risorse-isola`:

- `.preparati-isola` — 346px
- `.borsa-isola` — 996px
- `.note-isola` — 221px
- `.risorse-isola` — 101px (derivazione corretta, ma va comunque confermata)

Da ri-misurare con un browser vero a 390×844, stesso metodo (Chrome headless
via CDP) usato per calibrarle la prima volta.

## La scala tipografica del corpo non è applicata

`--fs-corpo` (1.0625rem) e `--lh-corpo` (1.55) sono dichiarati in
`tokens.css` e inutilizzati: `body` resta a 16px/1.5. Applicarli ora
invaliderebbe una seconda volta tutte le altezze riservate delle isole
idratate, nella stessa fase che le sta già correggendo alla cieca (vedi la
voce sopra). Deliberato: va applicato nella fase successiva, insieme a una
ri-misurazione.

## `base.css` non ha una guardia sui confini

`tokens.css` ha `confini.test.ts` a sorvegliare che non vi entrino regole di
componente. `base.css` non ha l'equivalente, e già ospita due classi di
utilità (`.valore`, `.tenue`) e una regola di componente (l'hover di
`.superficie`) oltre agli elementi ed `@media` che gli competono: nulla
impedisce che se ne accumulino altre. Quando la fase 2 cancella
`componenti.css`, quelle regole diventerebbero residuo che nessuno si
aspetta di trovare lì. Una guardia che limiti `base.css` a selettori di
elemento, `@font-face`, `@media` e un piccolo elenco nominato di eccezioni
vale la pena scriverla, ma su un confine che la fase 2 sta per ridisegnare.
