# Mappa delle fonti regolamentari di Kaelen

Questa pagina è l'indice rapido delle fonti usate dalla scheda. Non sostituisce i
manuali: serve a evitare di rileggere interamente i PDF ogni volta che cambia
l'implementazione.

## Regola di precedenza

Per Kaelen si applicano, nell'ordine:

1. _Player's Handbook_ 2024 per classe base, specie, equipaggiamento,
   incantesimi e regole generali;
2. _Dungeon Master's Guide_ 2024 per il background personalizzato;
3. _Player's Handbook_ 2014 solo per le capacità e la tabella degli
   incantesimi del Dominio della Tempesta che non hanno una versione 2024;
4. decisioni esplicite del DM in `Kaelen_note_DM.md`;
5. questa mappa e la specifica d'implementazione, che sono sintesi e non nuove
   fonti di regole.

Quando un elemento 2014 è usato da un personaggio 2024, si usano comunque la
classe, gli incantesimi, l'equipaggiamento e le regole generali 2024. La guida
ufficiale di conversione 2025 chiarisce inoltre che **Ordine Divino** sostituisce
**Competenze Bonus** delle vecchie sottoclassi del Chierico. Nel caso di Kaelen
non cambia il risultato: ha scelto Protettore e mantiene armature pesanti e armi
marziali.

## Profilo congelato

Questa mappa vale soltanto per:

- Kaelen, Goliath Medio, Chierico 3;
- Saggezza 16, Forza 16, Costituzione 13, Destrezza 12;
- Dominio della Tempesta 2014 innestato sul Chierico 2024;
- Ascendenza Gigante: Gigante della Tempesta;
- Ordine Divino: Protettore;
- background personalizzato Libero predone chondathan;
- cotta di maglia, scudo, maglio da guerra e simbolo sacro ad amuleto.

I valori correnti restano congelati al livello 3. La progressione quantitativa
di trucchetti, preparati e slot fino al livello 20 è invece indicizzata nella
[specifica d'implementazione](../superpowers/specs/2026-08-18-regole-kaelen-chierico.md#progressione-della-capacità-magica).
Un vero aumento di livello richiede comunque un nuovo audit delle scelte
effettuate, soprattutto talenti, caratteristiche, trucchetti e preparati.

## Fonti locali

### Player's Handbook 2024

PDF: [`DnD 5.5e - Players Handbook 2024.pdf`](../../../DnD%205.5e%20-%20Players%20Handbook%202024.pdf)

Estrazione OCR ricercabile: [`tmp/pdfs/phb2024.txt`](../../../tmp/pdfs/phb2024.txt)

Pagine stampate da consultare:

| Tema                      |        Pagine | Cosa verificare per Kaelen                                                    |
| ------------------------- | ------------: | ----------------------------------------------------------------------------- |
| Creazione del personaggio |         36-38 | punteggi, modificatori e background                                           |
| Chierico                  |         69-71 | d8, TS Sag/Car, incantesimi, Ordine Divino, Incanalare Divinità, progressione |
| Goliath                   |           192 | velocità, Storm's Thunder, Powerful Build                                     |
| Armi                      |       213-215 | attacchi, Versatile, Warhammer, assenza di Weapon Mastery                     |
| Armature                  |       218-219 | Chain Mail 16, For 13, Furtività, Shield +2                                   |
| Simbolo sacro             |           226 | amuleto da 5 mo indossato o impugnato                                         |
| Lancio degli incantesimi  |       235-238 | preparazione, slot, un solo slot per turno, componenti, concentrazione        |
| Danno e morte             |         27-29 | 0 PF, morte istantanea, TS morte, PF temporanei                               |
| Riposi                    | 370 e 372-373 | Riposo Lungo, dadi vita e Riposo Breve                                        |
| Glossario                 |       361-377 | condizioni, Opportunità, Unarmed Strike, rituali                              |
| Incantesimi               |        cap. 7 | testo della singola magia e componenti complete                               |

Ricerche rapide nell'estrazione:

```text
CORE CLERIC TRAITS
CLERIC FEATURES
LEVEL 2: CHANNEL DIVINITY
GOLIATH TRAITS
ONE SPELL WITH A SPELL SLOT PER TURN
USING A HIGHER-LEVEL SPELL SLOT
RITUALS
LONG REST
SHORT REST
DEATH SAVING THROWS
UNARMED STRIKE
OPPORTUNITY ATTACKS
```

### Dungeon Master's Guide 2024

PDF: [`Bookmarked_D&D_5e_2024_Dungeon_Masters_Guide_book_scan_ocr.pdf`](../../../Bookmarked_D%26D_5e_2024_Dungeon_Masters_Guide_book_scan_ocr.pdf)

Estrazione OCR ricercabile: [`tmp/pdfs/dmg2024.txt`](../../../tmp/pdfs/dmg2024.txt)

La pagina stampata 55, “Creating a Background”, autorizza esattamente il
pacchetto usato da Kaelen: tre caratteristiche associate, un talento di
Origine, due abilità, uno strumento e 50 mo di equipaggiamento.

### Dominio della Tempesta 2014

Il PDF 2014 non è presente nel repository. La decisione di campagna e i
riferimenti di pagina sono in [`Kaelen_note_DM.md`](../../../Kaelen_note_DM.md):
pp. 62-63 del _Player's Handbook_ 2014.

Conferme ufficiali online:

- [Updates in the Player's Handbook (2024)](https://www.dndbeyond.com/posts/1810-updates-in-the-players-handbook-2024), che elenca il Dominio della Tempesta tra le opzioni 2014 ancora utilizzabili;
- [Converting to System Reference Document 5.2.1](https://media.dndbeyond.com/compendium-images/srd/guide/converting-to-srd-5.2.1.pdf), che descrive l'adattamento delle vecchie sottoclassi al Chierico 2024.

Per il livello 3 di Kaelen restano attive:

- Ira della Tempesta: 3 usi per Riposo Lungo;
- Ira Distruttiva come opzione dello stesso contatore di Incanalare Divinità;
- Nube di Nebbia, Onda Tonante, Folata di Vento e Frantumare sempre preparati;
- nessun beneficio aggiuntivo da Competenze Bonus, sostituita da Protettore.

## Risultati numerici verificati

| Valore                      | Formula valida per Kaelen     |      Risultato |
| --------------------------- | ----------------------------- | -------------: |
| PF massimi                  | `8 + Cos 1 + 2 × (5 + Cos 1)` |             21 |
| CA con scudo                | `Chain Mail 16 + Shield 2`    |             18 |
| CA senza scudo              | `Chain Mail 16`               |             16 |
| Iniziativa                  | modificatore Des              |             +1 |
| Bonus di competenza         | Chierico 3                    |             +2 |
| CD incantesimi              | `8 + 2 + Sag 3`               |             13 |
| Attacco con incantesimi     | `2 + Sag 3`                   |             +5 |
| Maglio                      | `For 3 + competenza 2`        |             +5 |
| Danno maglio a una/due mani | `1d8/1d10 + For 3`            | 1d8+3 / 1d10+3 |
| Colpo senz'armi             | `1 + For 3`                   |              4 |
| CD Afferrare/Spingere       | `8 + For 3 + competenza 2`    |             13 |
| TS Concentrazione           | modificatore Cos              |             +1 |
| Percezione passiva          | `10 + Percezione 5`           |             15 |
| Capacità di trasporto       | `For 16 × 15 × 2`             |         480 lb |

## Lettura corretta della tabella del Chierico

Le colonne della tabella a p. 70 non rappresentano utilizzi dello stesso tipo:

- **Cantrips** è il numero di trucchetti conosciuti, tutti lanciabili senza
  slot e senza limite giornaliero proprio;
- **Prepared Spells** è il numero di incantesimi di livello 1+ scelti dalla
  lista del Chierico, non il numero di lanci;
- gli incantesimi del Dominio sono sempre preparati in aggiunta e non contano
  nella colonna **Prepared Spells**;
- **Spell Slots per Spell Level** determina i lanci normali disponibili fra
  due Riposi Lunghi; uno slot produce un lancio;
- un incantesimo preparato può essere ripetuto finché restano slot compatibili;
- un rituale preparato non consuma slot, mentre un trucchetto non ne richiede
  mai uno.

Per Kaelen i totali di lanci con slot dal livello 3 al 20 sono, in ordine:
`6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22`.
Questi numeri escludono rituali, oggetti, Incanalare Divinità e Intervento
Divino.

## Componenti materiali che cambiano la lanciabilità

Il solo valore `V, S, M` non basta per questi incantesimi. Lo stato iniziale di
Kaelen è:

| Incantesimo                    | Materiale                                      | Stato iniziale                        |
| ------------------------------ | ---------------------------------------------- | ------------------------------------- |
| Benedizione                    | simbolo sacro da almeno 5 mo                   | disponibile: amuleto da 5 mo          |
| Protezione dal Male e dal Bene | Acqua Santa da almeno 25 mo, consumata         | disponibile per un solo lancio        |
| Presagio                       | strumenti divinatori marcati da almeno 25 mo   | non disponibile                       |
| Fiamma Perenne                 | polvere di rubino da almeno 50 mo, consumata   | non disponibile                       |
| Riposo Tranquillo              | 2 mr, consumati                                | non disponibile: Kaelen parte da 0 mr |
| Legame Protettivo              | due anelli di platino da almeno 50 mo ciascuno | non disponibile                       |

Il focus non sostituisce un materiale con costo indicato e non sostituisce un
materiale consumato.

## Decisioni da non generalizzare

- I sei incantesimi preparabili sono il numero fisso del Chierico 3 2024, non
  `livello + Saggezza`.
- I quattro incantesimi del dominio non contano nei sei.
- Ai livelli 5, 7 e 9 Kaelen riceve altre due magie del Dominio; dal livello 9
  il totale sempre preparato del Dominio resta 10.
- Kaelen ha scelto Protettore, quindi conosce 3 trucchetti ai livelli 1-3, 4 ai
  livelli 4-9 e 5 dal livello 10; non riceve il trucchetto aggiuntivo di
  Taumaturgo.
- Incanalare Divinità ha due usi totali: un Riposo Breve ne recupera **uno**,
  un Riposo Lungo li recupera entrambi.
- Un Riposo Lungo 2024 recupera **tutti e tre** i dadi vita spesi, non metà.
- Storm's Thunder ha due usi perché il bonus di competenza di Kaelen è +2.
- Wrath of the Storm ha tre usi perché il modificatore di Saggezza è +3.
- Il maglio ha la proprietà di Maestria Push, ma Kaelen non possiede Weapon
  Mastery e quindi non la applica.
