# Backlog

Cose decise, non fatte, e il perché. Una voce esce di qui solo con il suo giro
di domande: niente entra in un ramo "già che ci siamo".

## Verifiche visive della fase 1, mai eseguite

**Questa è la voce da chiudere per prima: è l'unico buco vero della fase.**
Il ridisegno è stato costruito e revisionato interamente senza browser. Ogni
verifica a 390×844 che il piano chiedeva è stata sostituita da controlli
meccanici sull'HTML e sul CSS costruiti — che dicono se un valore è arrivato,
mai se si vede bene. Le cose sotto sono ordinate per probabilità di essere
davvero sbagliate.

**Su qualunque rotta**

1. **Le superfici si staccano dal fondo?** `--superficie` sta a 1,09:1 contro
   `--carta`: praticamente lo stesso colore. La separazione è affidata tutta
   alle due ombre lunghe, che su pergamena sono nero all'5-11% di alfa. Se
   quelle ombre non si vedono, l'intera scommessa del ridisegno cade e ogni
   pannello è testo piatto su carta.
2. **I bottoni sembrano ancora bottoni?** Il riempimento è a 1,13:1 dalla
   pagina e il bordo, ora traslucido, a 1,26:1. Guarda «Azzera sessione» nel
   menu, i `+`/`−` e i campi numerici del pannello ⚡, i bottoni di lancio.
3. **Apri il menu ☰.** Ha `z-index: 20` e crea un contesto d'impilamento, quindi
   la sua tendina è l'unica superficie del sito **senza** grana sopra: cerca uno
   stacco di luminosità all'apertura.
4. **Primo caricamento**: nessun lampo scuro, e i sei woff2 non devono spostare
   il layout quando atterrano — Fraunces e Inter hanno metriche molto diverse da
   Georgia e dal sans di sistema.

**`/scheda/`**

5. **Il blocco dei PF all'idratazione.** `min-height: 172px` è _calcolato_, non
   misurato. Se le difese e il titolo «Attacchi» saltano quando `PfTracker` si
   monta, quel numero è sbagliato — ed è in cima allo `start_url` dell'app.
6. Il blocco dei PF deve avere **un solo** filetto e stare visibilmente più in
   alto delle sezioni sotto: quel contrasto è tutto il senso di `sollevata`.
7. «Slot e risorse»: i 101px riservati non sono mai stati misurati con la
   larghezza nuova. Controlla il salto e se «Tuono della Tempesta» va a capo.
8. I numeri sono passati a JetBrains Mono, molto più larga del monospazio di
   sistema su iOS: CA/CD/INIZ e il numero dei PF non devono traboccare a 390px.
9. Gli `h2` sono Fraunces **600** ambra dove erano Marcellus 400: controlla che
   non urlino.
10. La griglia dei sigilli ha perso 8px di larghezza utile: i nomi a 0.68rem non
    devono spezzarsi peggio di prima.
11. Apri il pannello ⚡: la grana deve restare **sotto** (è nel top layer, quindi
    dovrebbe), e il pannello deve staccarsi dal suo velo scuro.

**`/scheda/` — aggiunte dalla fase 2**

22. **Le card degli attacchi a 390px.** Il totale del tiro è a destra in
    JetBrains Mono a 1.6rem, con `1d20+5` e la scomposizione sotto, allineati a
    destra: controlla che quella colonna non spinga «Maglio da guerra, due
    mani» a spezzarsi male, e che le tre righe del tiro restino allineate fra
    loro e non scalinate.
23. Le etichette delle proprietà (`Versatile (1d10)`) sono riquadri con bordo:
    a 390px devono stare su una riga sola, non andare a capo dentro le
    parentesi.
24. Le quattro sezioni hanno perso il riquadro: guarda che il filetto sotto la
    testata basti a separarle, e che due sezioni consecutive non sembrino una
    sola. È la stessa scommessa della voce 1, su un confine diverso.
25. **La lunghezza della sezione Incantesimi.** I 32 incantesimi del pool sono
    tutti in HTML e ora ognuno è una card intera invece di un riquadro da
    5rem: nascosti pesano lo stesso in DOM, ma se `hidden` fallisse la pagina
    diventerebbe lunghissima. Guarda che si vedano solo i sei preparati più i
    quattro del dominio.
26. **Lo stato spento.** Spendi tutti gli slot dal pannello ⚡ e guarda le card
    di 1° e 2°: devono attenuarsi a 0.55 di opacità restando leggibili, e i
    bottoni «Lancia» devono sparire. È il comportamento che hai chiesto alla
    Q14 e l'unica verifica che nessun test copre — i test provano gli
    attributi, non che l'attenuazione si veda.
27. Il sigillo nella testa della card è passato da 30px a 26px accanto a un
    nome su due righe: controlla che non sembri schiacciato.
28. **I contatori dentro le card.** Le caselle di Incanalare Divinità, Ira
    della Tempesta e Tuono della Tempesta ora le disegna l'isola `Contatori`
    per portale dentro le card. Sono l'unica cosa della sezione che arriva
    dopo l'idratazione: guarda che la testa della card non salti quando
    atterrano, e che le caselle restino allineate al testo «2 · Riposo Breve»
    sotto di loro.
29. `.risorse-isola` è scesa da 101px a **24px** perché le restano solo le due
    file di slot. Se il calcolo è sbagliato il salto è in mezzo alla rotta
    principale, come la voce 5.
30. `.preparati-isola` (370px) e `.note-isola` (245px) hanno riserve
    **ricalcolate** per l'imbottitura di `Superficie`, mai misurate: stesso
    difetto di `.pf-pannello` alla voce 5.

**`/scheda/` — aggiunte dalla fase 3**

31. **Le caselle degli slot sono passate da 14px a 20px** per contenere un
    sigillo. Guarda la fila a 390px: le sei caselle (4 di 1° + 2 di 2°) e le
    loro etichette devono ancora stare su una riga sola, e i sigilli dentro
    non devono sembrare francobolli.
32. **Lancia un incantesimo e guarda la sua casella.** Deve comparire il
    sigillo giusto, in ambra su fondo incassato, e restare dov'è quando ne
    lanci un secondo — le caselle si consumano da destra apposta. Poi spendi
    uno slot dal pannello ⚡: quella casella deve portare un trattino neutro,
    non un sigillo.
33. I contatori delle risorse dentro le card usano la stessa classe `.casella`
    e sono cresciuti con lei: controlla che non sbilancino la testa della
    card.
34. **La fascia delle difese è passata da tre colonne a quattro** (CA, CD,
    INIZ, ISP). A 390px ogni colonna scende da ~119px a ~89px: controlla che
    «INIZ» non vada a capo e che il `+1` non tocchi i bordi. È l'unico punto
    della fase 3 dove ho scelto di **non** riservare l'altezza — la quarta
    colonna è idratata ma le altre tre la tengono su — quindi se salta, salta
    in cima alla rotta principale.
35. La stella dell'Ispirazione: spenta è `☆` in inchiostro muto, accesa è `★`
    in ambra. Deve distinguersi senza leggere l'etichetta, e le due glifi
    devono avere la stessa larghezza o la fascia balla quando si accende.

36. **L'archivio a tutto schermo.** Apri «Tutti gli incantesimi» dalla coda
    dell'area magia: il `<dialog>` deve coprire lo schermo su fondo pergamena
    (non il velo scuro delle azioni), la testa deve restare appiccicata in
    alto mentre scorri, e «Chiudi» deve essere raggiungibile senza tornare in
    cima a un elenco lungo uno schermo e mezzo.
37. **Le spunte dell'archivio arrivano dopo.** L'elenco è statico ma le spunte
    sono idratate: il loro posto è riservato da un contenitore di 44px in
    `ElencoArchivio.astro`. Guarda che le righe non ballino quando atterrano.
38. A limite raggiunto — sei preparati — le spunte non messe devono risultare
    disabilitate e quelle messe no. È l'unico modo per accorgersi che il
    limite esiste.
39. `/preparati/` è la stessa cosa senza finestra: controlla che il titolo di
    sezione e il testo di aiuto non ripetano quello che dice già l'elenco.

**`/personaggio/`**

12. `.borsa-isola` riserva 996px, misurati alla larghezza vecchia: è la più
    esposta delle quattro. Guarda il fondo pagina all'idratazione.
13. Le tabelle: `th` è passato da 500 a 600 e i numeri a JetBrains Mono.
14. Il ritratto è incorniciato da un solo filetto a 1,26:1 — potrebbe essere
    semplicemente sparito.

**`/storia/`**

15. **Il foglio si stacca dal fondo?** È la decisione presa in corsa durante il
    task 3: sopra i 34rem dovresti vedere un foglio su una pagina. Se non si
    distingue, la scelta non valeva.
16. I capitoli devono essere ancora EB Garamond, **non** Inter, e il capolettera
    Fraunces e non un ripiego Georgia: è il punto dove un woff2 mancante si vede
    di più.
17. Il titolo di testata è Fraunces, molto più larga di Marcellus: non deve
    traboccare a 390px. Il suo filo doppio al 12% di alfa potrebbe non esserci.

**`/preparati/`, `/note/`, `/`**

18. Salto all'idratazione su `.preparati-isola` (346px) e `.note-isola` (221px).
19. `/note/`: l'area di testo si riconosce come campo, a 1,23:1 di riempimento e
    1,26:1 di bordo?
20. **Splash**: la grana è `fixed` e sta sopra una fotografia a tutto schermo che
    si muove sotto di lei. Al 5% può leggersi come schermo sporco invece che
    come texture della carta — è l'unico posto dove non ha carta di cui essere
    la grana.
21. Splash con movimento ridotto attivo: le due porte devono restare visibili.
    Il modo in cui fallisce è una home morta.

Da chiudere prima del rilascio. Le voci 1, 2, 5 e 20 possono ciascuna
significare «il ridisegno si vede sbagliato», e costano poco da correggere
finché il ramo è ancora aperto.

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

# Note

- https://www.dndbeyond.com/characters/169880275 scheda pg ufficiale D&D

# Lancio rituale

Rimandato di proposito, non dimenticato. L'audit regolamentare
(`docs/superpowers/specs/2026-08-18-regole-kaelen-chierico.md`, P1) chiede che
la card di un rituale preparato offra **due azioni distinte**: «Lancia con
slot» e «Lancia come rituale», la seconda senza slot e con dieci minuti in più.

Oggi la carta _dice_ che la via rituale esiste, e — questo sì fatto — non si
spegne più quando finiscono gli slot, che era il momento in cui l'opzione
serviva di più.

Manca l'azione vera, e manca per una ragione precisa: un rituale deve
verificare e consumare gli eventuali materiali e mantenere la Concentrazione
per i dieci minuti. Né i materiali né `concentrazioneSu` sono tracciati nello
stato di sessione. Un bottone «Lancia come rituale» oggi non cambierebbe
niente e prometterebbe una transazione che il codice non sa eseguire.

Ordine sensato quando si riprende: prima i materiali consumabili (P1), poi la
Concentrazione, poi il lancio rituale come transazione unica — slot e
materiali sottratti solo al completamento, come chiede la spec.
