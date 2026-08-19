# Incantesimi — carta muta, modale di lancio, barra degli slot

Scelto dagli sketch pubblicati il 2026-08-19: **carta A (muta)**, **barra C
(totale che si apre)** con il pannello aperto più generoso — pallini grandi,
una riga per livello, e nella casella consumata il sigillo dell'incantesimo che
l'ha spesa.

## La revisione di regolamento

La domanda era la distinzione fra «preparati» e «sempre attivi». Nel
regolamento 2024 **«sempre attivi» non esiste**: niente è attivo. Gli stati
sono tre, e l'audit li aveva già fissati.

| stato                  | come si dice         | consuma slot | dentro il limite di sei |
| ---------------------- | -------------------- | ------------ | ----------------------- |
| trucchetto             | **conosciuto**       | no           | no, non si prepara      |
| incantesimo scelto     | **preparato**        | sì           | sì, uno dei sei         |
| incantesimo di dominio | **sempre preparato** | sì           | no, si aggiunge         |

Un trucchetto non si prepara: si conosce. I quattro del Dominio della Tempesta
sono _sempre preparati_ — è il termine del manuale — e stanno **fuori** dal
limite di sei: non si scambiano al Riposo Lungo e non tolgono posto.

**Preparato non vuol dire disponibile.** I preparati dicono _quali_
incantesimi si possono scegliere, gli slot dicono _quante volte_. Al livello 3
Kaelen ha dieci incantesimi pronti e sei soli lanci fra due Riposi Lunghi.

La scheda oggi non distingue il dominio: Nube di Nebbia sembra uno dei sei e
non lo è. È la lacuna che questo lavoro chiude per prima.

## La carta

Una riga per incantesimo. Sigillo, nome doppio, riga tecnica in mono, livello
(o «a volontà» per i trucchetti), e la freccia che dice che si apre.

Fuori dalla carta vanno descrizione, «slot superiore», etichetta rituale e i
bottoni di lancio. Dieci incantesimi tornano a stare in uno schermo, e
sceglierne uno torna a essere una lettura invece che una scorsa.

Il dominio si riconosce da un **filetto ambra sul bordo sinistro** più la
parola «dominio» in coda alla riga tecnica: nessuna riga in più.

La carta resta **spenta** quando non c'è modo di lanciarla — la regola è già
`cartaSpenta` e non si riscrive.

## La modale

`<dialog>` a tutto schermo, la stessa lingua della modale dell'arma: ogni
scelta è un blocco coi suoi numeri e la sua conseguenza. Qui le scelte sono i
**livelli di slot**, e ogni blocco mostra:

- quanti slot di quel livello restano, come pallini;
- **cosa cambia** a usarlo, già applicato — «raggio 40 ft», non «+20 ft per
  ogni slot oltre il 1°», che è una formula da fare a mente;
- il bottone che lancia.

Il testo dell'incantesimo, le etichette e le avvertenze stanno sotto. Per il
dominio, la modale dice esplicitamente che è sempre preparato e fuori dai sei.

Il contenuto statico resta statico: la modale è markup di build con un
contenitore `[data-lancio]` dentro, e l'isola `ControlliLancio` ci disegna i
blocchi. È lo stesso schema di oggi, spostato dentro il dialogo.

## La barra degli slot

Appiccicata in cima alla sezione, sempre visibile mentre la si scorre.

**Chiusa** — una riga sola, per sempre: «4 slot su 6» più il comando che apre.
A qualunque livello resta una riga: è la ragione per cui questa forma ha vinto
sulle altre due.

**Aperta** — può prendersi lo spazio che serve: una riga per livello, pallini
grandi, e ogni casella consumata porta il **sigillo dell'incantesimo che l'ha
spesa**. Chi non ha un sigillo proprio prende il segno neutro, come lo slot
speso a mano dal pannello: `sigilloProprio` torna `null` apposta, e il ripiego
sul tag direbbe «un incantesimo di cura» invece di «questo incantesimo».

Il dato c'è già: `slotSpesi` è `Record<number, string[]>`, uno slug per slot in
ordine cronologico. Le caselle si consumano da destra, così la prima spesa
resta dov'è quando ne arriva un'altra.

## Cosa non si fa

- La barra **non** permette di spendere o recuperare: due punti di modifica
  per lo stesso numero sono la ragione per cui la Scheda si era gonfiata.
  Si spende lanciando, si recupera col Riposo Lungo.
- Il limite di **un solo slot per turno** resta dichiarativo: la scheda non ha
  un confine di turno affidabile, e un blocco persistente sopravvivrebbe per
  errore al turno.
- Niente conteggio dei rituali fra gli slot: un rituale non ne spende.
