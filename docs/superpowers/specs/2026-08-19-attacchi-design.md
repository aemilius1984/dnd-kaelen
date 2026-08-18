# Attacchi — la carta sintetica e la modale dell'arma

Scelto dagli sketch pubblicati il 2026-08-18: **forma sintetica C** (una carta
per _arma_, non per attacco) e **modale 2** (organizzata su cosa puoi fare, non
su com'è fatta l'arma).

## Il problema

La carta di oggi dice tutto insieme: nome, totale, scomposizione del tiro,
danno, tipo, gittata, proprietà, un paragrafo di descrizione e una nota. Al
tavolo, nell'istante in cui tiri, ne serve un terzo. Il resto è materiale da
consultare, e va consultato apposta.

In più tre cose che l'audit regolamentare chiede e che oggi non ci sono:

1. Il colpo senz'armi **deve distinguere tre scelte** — colpire, afferrare,
   spingere. Oggi stanno tutte in una nota di una riga.
2. L'impugnatura cambia la **CA**: 18 con lo scudo, 16 a due mani. Oggi è detto
   a parole, lontano dal numero.
3. La proprietà **Push** del Warhammer non va mostrata: Protettore dà la
   competenza nell'arma, non la Maestria.

## Cosa resta sulla carta

Nome, `+5` e il danno del modo scelto. Più il selettore dei modi, che è la sola
cosa nuova: è quello che rende la carta _dell'arma_ invece che dell'attacco.

Tutto il resto — scomposizione del tiro, gittata, proprietà, prosa, note,
avvertenze — passa nella modale.

## Il modello dei dati

`attacchi[]` resta l'unica lista, e resta una voce per _modo_. Si aggiungono
quattro campi facoltativi:

| campo        | tipo       | a cosa serve                                                        |
| ------------ | ---------- | ------------------------------------------------------------------- |
| `gruppo`     | `string`   | l'arma che raccoglie i modi in una carta sola. Assente = carta a sé |
| `modo`       | `string`   | l'etichetta del modo nel selettore («una mano», «colpisci»)         |
| `scudo`      | `boolean`  | se questo modo lascia lo scudo impugnato — da cui si _deriva_ la CA |
| `avvertenze` | `string[]` | i «da sapere» dell'arma, mostrati solo nella modale                 |

E una lista facoltativa `alternative[]` per le opzioni che **non tirano per
colpire**: afferrare e spingere. Ogni alternativa porta `nome`, `nomeEn`, il
tiro salvezza contrastato e l'effetto; la CD **non** si scrive, si deriva.

Nessun valore derivato entra nei dati. La CA viene da `classeArmatura(pg,
scudo)`, che esiste già; la CD del contrasto da una funzione nuova,
`cdContrasto(pg)` = `8 + competenza + mod(Forza)`.

## La carta

```
┌──────────────────────────────────────┐
│ Maglio da guerra              +5  ›  │  ← bottone: apre la modale
│ Warhammer                            │
│ [ una mano │ due mani ]              │  ← radio, zero JavaScript
│ 1d8 + 3 contundenti · CA 18          │  ← cambia col modo
└──────────────────────────────────────┘
```

Il selettore è un gruppo di `input[type="radio"]` nascosti; la riga di sintesi
cambia con `:has()`. Nessun JavaScript, e la scelta non è stato di sessione: al
ricaricamento torna al primo modo. È deliberato — l'audit dice che la UI non
deve _dedurre_ cosa Kaelen stia impugnando, solo dirlo.

**Deviazione dallo sketch:** nello sketch il chevron sta sulla riga di sintesi.
Qui il bottone è la riga del titolo: un `<button>` non può contenere il
selettore, e due bottoni per la stessa azione sono due fermate di tabulazione
per la stessa destinazione.

## La modale

`<dialog>` a tutto schermo, la stessa forma della Vitalità. Il contenuto è
tutto statico: nessuna isola — un'isola non contiene mai contenuto statico.
L'apertura è l'eccezione di JavaScript concessa esplicitamente, poche righe
inline come già fa `Menu.astro`.

```
ARMA                                 ×
Maglio da guerra                +5
Warhammer · 5 ft · Versatile    FOR +3 · comp +2
── COME LA IMPUGNI ──
┌ una mano              1d8 + 3 ┐
│ Lo scudo resta in mano: CA 18 │
└ due mani             1d10 + 3 ┘
│ Niente scudo: CA 16           │
── DA SAPERE ──
prosa e avvertenze
```

Per il colpo senz'armi la stessa struttura porta le tre scelte dell'audit:
`colpisci` con i suoi danni, `afferra` e `spingi` con la CD derivata.

## Cosa non si fa

- La carta **non** cambia la CA della scheda. Mostrarla è un'indicazione
  operativa; dedurla in ogni istante è quel che l'audit vieta.
- La proprietà `Push` non compare, né sulla carta né nella modale.
- Il guscio della modale **non** viene ancora estratto in un componente
  condiviso con la Vitalità: quella è Preact, questa è statica. Condividono il
  CSS, non il markup.
