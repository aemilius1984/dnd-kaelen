# Oggetti al tavolo ed effetti temporanei

Due funzionalità, una spec sola, una migrazione sola di `StatoSessione`. Le
scelte vengono dagli sketch del 2026-08-20 (`.superpowers/brainstorm/`):
**striscia degli effetti sotto le difese**, **consumabili in coda a «cosa puoi
spendere»**, **Borsa a tre gruppi** su `/personaggio/`.

Il filo comune fra le due è più stretto di quanto sembri: entrambe sono roba
che il giocatore crea al tavolo e che il repo non conoscerà mai. Un forziere
non si apre con una pull request.

## Cosa si è trovato guardando il codice

Tre cose che cambiano il disegno, tutte già in repo prima di questo lavoro.

**`consumabile` è una bandiera morta.** Ogni voce di `equipaggiamento` la
porta, lo schema la valida, e nessuna interfaccia la legge: `Borsa.tsx` disegna
la corda da cinquanta piedi e la fiala di acqua santa con lo stesso identico
markup. Il gancio era già pagato e non è mai stato usato.

**`derive.ts` calcola tutto dai punteggi.** `classeArmatura`, `perColpire`,
`dannoTesto`, `bonusTiroSalvezza`, `cdIncantesimi`, `capacitaTrasporto`:
nessuna di queste funzioni legge altro che `pg`. Passargli un Kaelen con la
Forza a 20 restituisce sei numeri aggiornati senza scrivere una riga di
aritmetica nuova. È la ragione per cui il motore dei modificatori costa poco.

**`campiVersione` include l'equipaggiamento.** Toccare `id` o `quantita` di una
voce in repo azzera la sessione salvata. Un oggetto raccolto al tavolo non può
vivere lì dentro, e questo decide da solo dove va.

## Il motore

Una funzione sola in `src/lib/adesso.ts`:

```ts
export function kaelenAdesso(pg: Personaggio, s: StatoSessione): Adesso;
```

Restituisce il personaggio com'è **in questo momento**, con i punteggi già
riscritti, più gli addendi da applicare alle voci finali e i promemoria da
mostrare. Tutto il resto della scheda continua a chiamare `derive.ts` come
prima, solo su `adesso.pg` invece che su `pg`.

Tre sorgenti alimentano lo stesso motore: gli **effetti temporanei**, gli
**oggetti indossati**, l'**esaurimento**. Hanno durate diverse e producono
modifiche identiche. Una strada sola perché due strade per lo stesso numero
sono due strade che prima o poi divergono, che è la frase già scritta in
`derive.ts` sul perché `perColpire` è una somma e non un calcolo a parte.

### Le due file di modifiche

```ts
export type VoceFinale = 'ca' | 'ts' | 'colpire' | 'prove' | 'velocita';

export interface Modifica {
  genere: 'punteggio' | 'voce';
  bersaglio: Caratteristica | VoceFinale;
  valore: number;
}
```

| genere      | bersaglio                        | `valore` è         | come si compone   |
| ----------- | -------------------------------- | ------------------ | ----------------- |
| `punteggio` | for, des, cos, int, sag, car     | il punteggio nuovo | il più alto vince |
| `voce`      | ca, ts, colpire, prove, velocita | un addendo         | si sommano        |

Il `punteggio` è **assoluto e non un delta**, perché è così che il manuale
scrive gli oggetti che lo toccano: una Cintura di Forza del Gigante dice che il
punteggio _diventa_ ventuno, non che sale di cinque. Da lì viene anche la regola
di composizione: due oggetti che impostano la stessa caratteristica non si
sommano, vince il più alto, che è la regola generale del regolamento sugli
effetti che non si cumulano.

Le voci finali invece si sommano davvero. Scudo della Fede e uno scudo magico
danno insieme tre punti di CA, ed è corretto.

### La trappola della CA

**`pg.armatura` resta l'unica sorgente della CA di base.** La cotta di maglia e
lo scudo di Kaelen ci sono già dentro, `classeArmatura()` li usa già per dire
diciotto, e compaiono _anche_ in `equipaggiamento`: sono due elenchi che
descrivono gli stessi due oggetti.

Un oggetto indossato dichiara quindi solo il **delta** rispetto a ciò che già
porti. Uno scudo +1 si scrive `{ genere: 'voce', bersaglio: 'ca', valore: 1 }`.
Se lo si scrivesse come «scudo, CA 2» il totale conterebbe lo scudo due volte e
nessun test se ne accorgerebbe, perché entrambe le strade producono un numero
plausibile. Il vincolo va nel commento del modulo e in un test che lo dichiara.

Il sommario in cima alla Borsa — «Con quel che hai addosso: CA 19, FOR 20» —
esiste per questo: è il solo posto in cui un doppio conteggio si vede a occhio.

## Gli effetti temporanei

```ts
export interface Effetto {
  id: string;
  nome: string;
  /** Lo slug dell'incantesimo, se l'effetto nasce da un lancio. */
  origine?: string;
  /** Etichetta, non un conto: «1 minuto». Vedi sotto. */
  durata: string;
  concentrazione: boolean;
  /** Quel che non diventa un numero: «+1d4 ai tiri per colpire e ai TS». */
  promemoria?: string;
  modifiche: Modifica[];
  accesoIl: string;
}
```

`modifiche` può essere vuoto. Benedizione è un effetto senza nessuna modifica
numerica: dà un dado, e un dado non è un addendo. Sta nella striscia col suo
promemoria e non tocca niente. Scudo della Fede è il contrario: nessun
promemoria, una modifica sola, e la CA in pagina legge venti.

### La concentrazione

Bandiera sull'effetto, e **una sola alla volta**. Accenderne un secondo spegne
il primo dicendolo: non in silenzio, perché una regola applicata di nascosto è
indistinguibile da un errore.

È la ragione singola più forte per costruire questa funzionalità. Kaelen ha
Benedizione, Silenzio, Blocca Persone, Calmare Emozioni e Nube di Nebbia:
cinque incantesimi che si escludono a vicenda, in una lista dove niente lo
dice. Nella striscia la concentrazione ha un chip suo, ambra e col cerchio
pieno, diverso da tutti gli altri.

### La durata non si conta

Un'etichetta di testo, presa dai dati dell'incantesimo, e basta. Niente
contatore di round.

Il contatore sembra la cosa giusta e non lo è: richiede che qualcuno prema un
bottone a ogni round di ogni combattimento, e la prima volta che ci si dimentica
mente con l'aria di dire il vero. Un'etichetta non promette nulla, quindi non
può mentire. Chi legge «1 minuto» sa che deve contare da sé, ed è esattamente
quello che già fa.

### I riposi

Entrambi i riposi spengono **tutti** gli effetti temporanei. Non è una
semplificazione: un riposo breve dura un'ora, e l'effetto più lungo che Kaelen
sa produrre ne dura dieci minuti.

Due eccezioni dichiarate:

- l'**esaurimento** non è un effetto e non sta in quella lista. Vive in un campo
  suo, `esaurimento: number`, e il riposo lungo ne toglie un livello. Il breve
  non lo tocca. Nella 2024 ogni livello è −2 a ogni prova col d20 e −5 piedi di
  velocità: tocca cinque voci insieme, e a mano si sbaglia sempre.
- i **modificatori da oggetto indossato** non sono temporanei. I riposi non li
  guardano.

`conseguenzaRiposo` in `riposi.ts` è già la funzione che dice in anticipo cosa
si perde, calcolata su questa sessione e non sul manuale. Le righe nuove vanno
lì dentro.

### Da dove nascono

Tre vie, in ordine di frequenza attesa.

1. **Dal lancio.** `ControlliLancio` è già il punto in cui dichiari di aver
   lanciato qualcosa, e lo schema degli incantesimi porta già `concentrazione` e
   `durata`. Gli incantesimi che meritano una riga `effetto` nei dati si
   decidono uno per uno in fase di piano, guardando la lista.
   **Proposto, mai automatico**: si lancia Benedizione su un compagno e
   l'effetto non è su Kaelen.
2. **Dalla striscia**, col «+» in coda, per gli stati che non vengono da un suo
   incantesimo: avvelenato, spaventato, la benedizione lanciata da un altro
   chierico.
3. **Dagli oggetti indossati**, che non si accendono affatto: ci sono finché li
   porti.

## Gli oggetti

```ts
export interface OggettoAggiunto {
  /** `mio:<n>`. Il ':' non può comparire in uno slug: la collisione con gli id
   *  del repo è impossibile per costruzione, non per fortuna. */
  id: string;
  nome: string;
  quantita: number;
  consumabile: boolean;
  nota?: string;
  /** Vuoto se non è magico. */
  modifiche: Modifica[];
}
```

Quattro campi visibili, come deciso: nome, quantità, consumabile, nota. Niente
`nomeEn`, perché è roba inventata al tavolo e non una voce di manuale. Niente
peso e niente valore: sono le colonne che si compilano due volte e poi non si
guardano più, e con 480 libbre di capacità di trasporto l'ingombro non è un
vincolo vero per Kaelen.

I modificatori stanno dietro una riga chiusa, **«è un oggetto magico?»**, che si
apre solo se la tocchi. Stesso mestiere del `<details class="correzioni">` nel
pannello ⚡: il caso d'angolo si vede che lo è, e chi aggiunge una corda non si
trova davanti un pannello da artefatto. Un modulo solo, usato da tutt'e due le
sedi.

### Sopravvivono all'azzeramento

Quando i dati della scheda cambiano, `carica()` butta via la sessione e riparte
pulita. Quel che si perde sono numeri che il repo sa ricostruire.

Gli oggetti aggiunti a mano no. Sono l'unica cosa nello stato di cui l'autore è
il giocatore, e sparirebbero per sempre perché qualcuno ha corretto un refuso in
`quantita`. `statoIniziale` li accetta dal salvataggio precedente e li riporta
dentro. **Stessa cosa per le note**, che oggi si perdono allo stesso modo e per
la stessa ragione non dovrebbero.

Gli effetti attivi invece si azzerano, e va bene così: durano minuti, e fra due
build ne passano di più.

### Cosa sale in scheda

Solo i **consumabili**: quelli dei dati (acqua santa, razioni) e quelli aggiunti
a mano marcati tali. La corda da cinquanta piedi non ha niente da fare sulla
scheda.

Le cariche si disegnano a caselle, come le risorse, **fino a cinque**. Oltre si
scrive il numero: sette quadratini per le razioni sono un conto che nessuno
legge a colpo d'occhio, e le razioni non si spendono in combattimento.

Consumare passa dalla **striscia Annulla**. Ha la stessa grammatica di spendere
una carica: un gesto solo, irreversibile, fatto col pollice mentre qualcun altro
parla. `annulla.ts` e `StrisciaAnnulla` esistono già.

Gli effetti no: un effetto acceso per sbaglio si spegne toccando il × sul chip,
e una striscia che copre lo schermo per una cosa che si annulla da sé è rumore.

## Cosa si vede

### `/scheda/`

**La striscia degli effetti**, subito sotto la fascia CA/CD/INIZ. I chip stanno
sotto i numeri che modificano: leggi venti, e sotto leggi perché. Compare solo
quando c'è qualcosa; a effetti spenti resta il solo «+».

La regola che questa funzionalità esiste per far rispettare è la
concentrazione, e la si rispetta solo se la si vede **senza aprire niente**.
Ogni disegno che la nasconde dietro un tocco la nasconde dietro lo stesso tocco
che oggi non fai, e per cui la dimentichi.

**La sezione consumabili**, in coda a «Capacità e reazioni». Quella sezione si
intitola già «cosa puoi spendere», e una fiala di acqua santa è una cosa che
spendi con la stessa grammatica di una carica di Incanalare Divinità: stesse
carte, stesse caselle, nessun linguaggio visivo nuovo. Gli oggetti aggiunti a
mano portano il **filetto ambra sul fianco**, lo stesso segno che sulle carte
incantesimo distingue il dominio.

### La fascia delle difese, e come resta statica

CA, CD e INIZ diventano tutti e tre modificabili: la CA da un addendo, la CD
dalla Saggezza, l'iniziativa dalla Destrezza. Ma la fascia **non diventa
un'isola**.

L'isola scrive dentro il markup statico attraverso `createPortal`, cercando i
punti d'innesto per attributo — la tecnica che `Contatori.tsx` usa già con
`[data-caselle]`. Il build continua a stampare i numeri di base, che senza
JavaScript restano giusti e sono quelli veri nel novanta per cento dei momenti;
l'isola li sovrascrive solo quando c'è qualcosa da sovrascrivere, mostrando il
valore di base barrato accanto a quello nuovo.

Vale anche per **Attacco e CD nella barra appiccicata degli incantesimi**, che
sono statici dal commit `1af6e3b` e dipendono dalla Saggezza: stesso innesto,
stesso portale. Lasciarli fuori significherebbe avere due numeri stantii nel
punto della pagina che si guarda mentre si sceglie cosa lanciare.

Così il vincolo tiene da entrambi i lati: l'isola non contiene contenuto
statico, e il contenuto statico non finisce dentro un'isola.

### `/personaggio/`, la Borsa

Tre gruppi al posto di un elenco piatto di sedici voci tutte uguali.

| gruppo             | cosa contiene                                   | stato  |
| ------------------ | ----------------------------------------------- | ------ |
| addosso e in pugno | armatura, scudo, focus, arma, oggetti indossati | aperto |
| consumabili        | gli stessi che salgono in scheda                | aperto |
| nello zaino        | tutto il resto                                  | chiuso |

In cima il sommario di quel che porti addosso. Le monete scendono in fondo: si
toccano a fine sessione, non durante.

Il raggruppamento dei tre oggetti del repo che stanno «addosso» è
**presentazionale**: un campo facoltativo nello schema, fuori da `campiVersione`,
perché spostare la lampada da un gruppo all'altro non vale l'azzeramento di una
sessione.

## Lo stato di sessione

`SCHEMA_VERSION` passa da 4 a **5**. Campi nuovi:

```ts
oggettiAggiunti: OggettoAggiunto[];
effetti: Effetto[];
/** Gli id degli oggetti aggiunti che sono indossati. */
indossati: string[];
/** 0..6. Nella 2024 il sesto livello è la morte. */
esaurimento: number;
```

La migrazione da 4 a 5 è la più facile che ci sia: quattro campi che prima non
esistevano, quindi vuoti. Si aggancia alla catena già in piedi — `migraDa2`,
`migraDa3`, e adesso `migraDa4` — che è una catena e non un ventaglio di
strade, per la ragione già scritta nel commento di `migraDa2`.

**La nuvola non costa niente.** `0001_sessioni.sql` mette l'intero
`StatoSessione` in una colonna `stato` come JSON: i campi nuovi viaggiano da
soli, e non serve nessuna seconda migrazione D1. È il motivo per cui questo
lavoro può stare tutto sul ramo prima del merge, e la migrazione remota resta
una sola.

## Vincoli che restano in piedi

- HTML statico. Le due isole nuove scrivono in innesti di build, non generano
  contenuto che il build avrebbe potuto stampare.
- I valori derivati stanno in `lib/`, e adesso anche il motore: `derive.ts` non
  cambia di una riga, `adesso.ts` gli passa un personaggio diverso.
- Verifica visiva a 390×844. Ogni bersaglio da toccare almeno 44px, compresi il
  × sui chip e i passi di quantità.
- `npm run gate` resta offline. Niente rete, niente wrangler.
- Prosa e commenti in italiano.

## Cosa non c'è, e perché

- **Contatore di round.** Vedi sopra: mente.
- **Modificatori su un singolo tiro salvezza o su una singola prova.** Fra tutto
  quel che Kaelen può subire o lanciare non ce n'è uno che li serva: Guida è
  +1d4 su una prova, che è un promemoria e non un addendo. Il campo si aggiunge
  il giorno in cui serve davvero.
- **PF massimi modificati.** Aiuto li alza, ed è un altro campo dello stato con
  altre regole di recupero. Merita il suo giro, non una riga in coda a questo.
- **Peso e ingombro.** Vedi sopra.
- **Modificatori sugli oggetti del repo.** Kaelen non possiede niente di magico.
  Lo schema resta com'è finché non è vero il contrario.

## Cosa resta all'occhio umano

Da provare al telefono vero, insieme alle verifiche già in sospeso sul ramo
`fix/segnalazioni-mobile`:

- la striscia con tre effetti addosso a 390 di larghezza: scorre in orizzontale
  o va a capo, e quale delle due è meno peggio col pollice;
- la fascia delle difese con la CA modificata: se il valore barrato accanto si
  legge o è solo sporco;
- il modulo «aggiungi oggetto» mentre il DM sta ancora descrivendo il forziere,
  che è la sola prova che conta per capire se ha un campo di troppo;
- una sessione vera col chip della concentrazione, per sapere se il secondo
  incantesimo che spegne il primo è un sollievo o una sorpresa sgradita.
