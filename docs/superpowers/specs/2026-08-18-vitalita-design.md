# La modale Vitalità

Stato: approvata il 2026-08-18, non ancora implementata.
Ramo: `fix/lampo-in-loop`.
Tela dei mockup: https://claude.ai/code/artifact/60f513a5-136e-43ef-a57d-d1d27fed75d6
(artboard **B · Colonna — scelta**; A e C restano come memoria delle alternative
scartate, `Oggi` come riferimento di partenza).

## Perché

Oggi la Scheda mostra i punti ferita in sola lettura e manda ogni modifica al
pannello ⚡: un cassetto unico, alto 85vh, che in 228 righe contiene danno,
cura, temporanei, TS morte, cinque righe di slot, risorse, dadi vita, riposo
breve e lungo, Ispirazione. Per togliere tre PF si apre una cosa che parla
anche di incantesimi.

Questa spec sostituisce quel percorso **per il solo gruppo della vitalità** con
una modale a tutto schermo che si apre dalla sezione a cui appartiene. È il
primo passo di un cambio più largo — un gruppo, una modale — non un ridisegno
del pannello ⚡, che resta dov'è.

## Il confine del gruppo

Dentro: punti ferita, danno, cura, PF temporanei, dadi vita, TS contro morte,
Ispirazione Eroica.

Fuori: riposo breve e lungo (toccano slot e risorse, non solo la vitalità),
slot incantesimo, risorse di classe. Restano dove sono oggi.

## Le decisioni prese

1. **Il ⚡ non si tocca.** Resterà, e verrà deprecato a passi in un lavoro
   successivo. Vedi «Il costo che accettiamo».
2. **Immissione a due tempi**: prima la quantità con una rotella che si gira
   col dito, poi il verbo (danno / cura / temporanei). Mai la tastiera di
   sistema come strada principale — su iOS copre metà schermo e sposta il
   layout sotto le dita.
3. **Registro tipografico, non illustrativo.** Il fondale vettoriale inciso è
   stato disegnato, guardato e **scartato**: quel che resta è uno strumento —
   tacche incise sotto il metro, filetti, la banda di scelta della rotella. La
   decisione è cambiata dopo aver visto i mockup ed è deliberata.
4. **Ogni riga che elenca qualcosa di consumabile porta il suo comando.** Vale
   per l'Ispirazione (_Prendi_ / _Spendi_), per i dadi vita (_Spendi_) e per i
   TS morte (_✓_ / _✗_). In una modale che serve ad agire, una riga di sola
   lettura è un buco.

## Anatomia — la scheda in pagina

Sostituisce l'attuale `.pf-pannello`. È un `<button>` unico: si legge di colpo
e si apre col pollice.

- Riga di testata: kicker `punti ferita` a sinistra, `apri ›` a destra.
- Numero: `3rem` in `--font-mono`, colore `--lampo`, allineato **a sinistra**
  dove comincia la lettura — non centrato come oggi. Accanto `/ 21` in
  `--inchiostro-tenue`.
- Chip dei temporanei a destra sulla stessa riga: pillola con bordo `--ambra`,
  `+4 TEMP`. **Occupa il suo posto anche quando i temporanei sono zero**
  (invisibile, non assente): vedi «L'altezza riservata».
- Metro: alto 14px, bordo `--filetto`, raggio 3px, fondo
  `--superficie-incassata`, riempimento `--lampo`. Sotto, 22 tacche incise
  (12px ogni quinta, 7px le altre) a opacità 0.36 / 0.2.
- Piede, oltre un filetto: pallini dei dadi vita e stella dell'Ispirazione.

La fascia `.difese` scende **da quattro colonne a tre**: restano CA, CD, INIZ.
L'Ispirazione se ne va da lì — era un interruttore travestito da numero in
mezzo a tre numeri veri — e vive nella Vitalità, dove la si accende.

## Anatomia — la modale

`<dialog>` a tutto schermo. Il precedente in casa è `dialog.archivio`, che è
già a tutto schermo per la stessa ragione: non è una tendina da due bottoni.

Ordine dall'alto:

1. Testata: kicker `Vitalità`, pulsante di chiusura da 44px.
2. Stato: numero `4.2rem` mono in `--lampo`, `/ 21` accanto, chip dei
   temporanei a destra; metro alto 16px con le tacche sotto (15px / 9px).
3. Righe del consumabile, alte **56px** ciascuna, separate da filetti, ognuna
   con il suo comando alto 40px a destra:
   - `dadi vita` — pallini + `d8` — **Spendi**
   - `ispirazione eroica` — stella piena in `--ambra` se accesa, contorno in
     `--inchiostro-muto` se spenta — **Spendi** se accesa, **Prendi** se spenta
   - `ts contro morte` — solo a 0 PF — conteggio in `--allerta` — **✓** e **✗**
4. Zona del pollice, ancorata in fondo con `margin-top: auto`:
   - a sinistra la rotella, 108×252px;
   - a destra i tre verbi impilati, **76px** ciascuno, bordo colorato e
     sottotitolo che dice cosa faranno: «toglie 4 PF», «rimette 4 PF»,
     «imposta a 4». Il sottotitolo si aggiorna col valore della rotella.
   - Sopra la coppia, a destra, il collegamento **digita**.

Colori dei verbi: danno `--allerta`, cura `--lampo`, temporanei `--ambra`.

## La rotella

Il movimento **non si scrive**. Un contenitore che scorre in verticale con
`scroll-snap-type: y mandatory` e una cifra per punto d'aggancio è già una
rotella: inerzia, rimbalzo e frenata li mette il browser, ed è la stessa fisica
del selettore di data di iOS. La rotella del mouse ci scorre dentro nativamente;
il trascinamento col puntatore su desktop è una manciata di righe sopra.

Quel che si scrive è **la conversione**, e vive in `src/lib/rotella.ts` come
funzioni pure:

- `valoreDaScorrimento(scrollTop, passo, minimo)` → il numero sotto la banda;
- `scorrimentoDaValore(valore, passo, minimo)` → l'inverso, per posizionare la
  rotella all'apertura e dopo un `digita`.

Tutto ciò che può sbagliare sta lì, e si prova con vitest senza browser.
Nell'isola resta il cablaggio: lettura continua durante lo scorrimento (il
numero grande si aggiorna sotto il dito) e conferma al fermo con `scrollend`,
con ripiego su uno `scroll` con debounce dove `scrollend` non c'è.

Passo: 40px per cifra, 52px la cella centrale sotto la banda di scelta.
Intervallo: da 0 a 30. Oltre quel numero si usa **digita**.

## Lo stato: nessuna logica nuova

La modale non introduce una sola regola di gioco. Chiama le funzioni che
esistono già in `src/lib/sheet-state.ts` — le stesse che chiama il ⚡ oggi:

| gesto       | funzione                                      |
| ----------- | --------------------------------------------- |
| Danno       | `applicaDanno(x, q)`                          |
| Cura        | `applicaCura(x, pg, q)`                       |
| Temporanei  | `impostaPfTemporanei(x, q)`                   |
| Ispirazione | `impostaIspirazione(x, boolean)`              |
| Dado vita   | `spendiDadoVitaConCura(...)`                  |
| TS morte    | `segnaTsMorte(x, 'successo' \| 'fallimento')` |

## Accessibilità

- `showModal()` porta con sé trappola del fuoco ed Escape, senza scriverli.
- La rotella prende `role="spinbutton"` con `aria-valuenow` / `aria-valuemin` /
  `aria-valuemax` e risponde alle frecce.
- Il campo **digita** è una strada **equivalente**, non un ripiego: chi naviga
  da tastiera o con un lettore di schermo non può girare niente. È la stessa
  ragione per cui il menu è rimasto su `<details>` invece di scendere alla
  checkbox travestita.
- Ogni verbo applicato scrive l'esito in una regione `aria-live` («17 punti
  ferita»): senza, chi non vede il numero cambiare non sa che è successo.
- Ogni bersaglio è alto almeno 44px. Le righe del consumabile sono 56, i verbi
  76, i comandi 40 dentro righe da 56.

## L'altezza riservata, da misura a costante

`.pf-pannello` porta oggi `min-height: 172px`, **misurato con Chrome headless**.
Le altezze riservate di questo progetto sono cinque, tutte misurate così tranne
una calcolata a mano, che la nota di sessione segnala come incerta perché
nessuna sessione recente ha avuto un browser.

La scheda-riepilogo nuova evita del tutto quel problema: **altezza fissa, non
minima**. Ogni riga dichiara la propria altezza in CSS, e l'altezza della
scheda è la somma di quelle costanti più imbottitura e bordi. Nessun contenuto
può farla variare — per questo il chip dei temporanei occupa il suo posto anche
a zero.

Il valore di partenza è **210px**; non va copiato a fiducia, va fatto tornare:
una prova unitaria legge il CSS, somma le altezze dichiarate delle righe più
imbottitura e bordi e verifica che il totale sia esattamente l'altezza fissa
dichiarata. Se qualcuno cambia una riga senza aggiornare il totale, il gate
fallisce invece di far saltare la pagina all'idratazione.

## Il costo che accettiamo

Finché il ⚡ resta, danno e cura si potranno fare da due posti. Non è un rischio
di correttezza — entrambi passano dalle stesse funzioni di `sheet-state.ts`, e
non possono divergere come divergevano prima della riscrittura — ma è
interfaccia doppia, e va detto. Quando comincerà la deprecazione del ⚡, il
blocco dei PF è il primo pezzo da togliergli: questa modale lo sostituisce
esattamente.

## File toccati

| file                          | cosa                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/islands/PfTracker.tsx`   | diventa `src/islands/Vitalita.tsx`: riepilogo, grilletto e dialogo in un'isola sola                 |
| `src/islands/Rotella.tsx`     | nuovo — presentazionale, riceve un valore e richiama `onCambia`                                     |
| `src/lib/rotella.ts`          | nuovo — le due conversioni pure                                                                     |
| `src/islands/Ispirazione.tsx` | eliminato: il suo display entra nella Vitalità (verificare prima che nessun'altra rotta lo importi) |
| `src/pages/scheda.astro`      | nuova isola, `.difese` a tre colonne, via l'isola Ispirazione                                       |
| `src/styles/componenti.css`   | `.pf-pannello` → altezza fissa; `.difese` a 3 colonne; `dialog.vitalita`; la rotella                |

## Le prove

1. `src/lib/__tests__/rotella.test.ts` — le due conversioni: andata e ritorno,
   estremi, scorrimento negativo da rimbalzo elastico, passo non intero.
2. `src/islands/__tests__/Vitalita.test.ts` — jsdom + `preact/render`, come gli
   otto test di isola esistenti: danno che scende, cura che non supera il
   massimo, temporanei che si impostano, Ispirazione che si accende e si
   spegne, dado vita che cura e si scala, TS morte che **compaiono solo a 0 PF**.
3. `src/styles/__tests__` — la guardia dell'altezza fissa descritta sopra, e
   che i bersagli dichiarati non scendano sotto 44px.

## Fuori perimetro

Riposo breve e lungo; slot incantesimo; risorse di classe; qualunque modifica a
`PannelloAzioni.tsx`; le modali degli altri gruppi, che seguiranno una per
volta con lo stesso guscio.

## Cosa resta da verificare in un browser

Nessuna sessione senza browser può chiudere queste tre:

1. **Che la rotella giri bene davvero.** `scroll-snap` più inerzia si giudica
   col dito, non leggendo il CSS: se il passo di 40px sia troppo corto per il
   pollice, e se `scrollend` arrivi quando serve su iOS.
2. **Il metro con le tacche a 390px.** 22 tacche in 358px di larghezza utile
   sono ~16px di passo: da guardare, perché sotto una certa distanza si
   impastano in una riga grigia.
3. **I 210px di altezza fissa** vanno confrontati con la resa vera almeno una
   volta, anche se la prova unitaria li tiene coerenti con le loro parti.
