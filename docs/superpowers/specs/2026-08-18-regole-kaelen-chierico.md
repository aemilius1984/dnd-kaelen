# Specifica regolamentare della scheda di Kaelen

**Stato:** pronta per l'implementazione  
**Ambito:** Kaelen, oggi Chierico 3 del Dominio della Tempesta, con progressione
magica prevista fino al livello 20  
**Pagina verificata:** `/scheda/` al 18 agosto 2026

## Risultato dell'audit

La scheda rappresenta correttamente il nucleo del personaggio: caratteristiche,
PF massimi, CA, attacchi, CD, slot, numero di preparati, capacità di classe,
Dominio della Tempesta e ascendenza Goliath. Non è però ancora una fonte
regolamentare affidabile durante tutta la sessione: due flussi persistenti sono
errati e diversi casi sono descritti o automatizzati solo in parte.

| Priorità | Stato attuale                                                                                 | Correzione richiesta                                                                  |
| -------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| P0       | Il Riposo Lungo recupera metà dei dadi vita                                                   | recuperare tutti i 3d8 spesi                                                          |
| P0       | I sei preparati si possono cambiare in qualsiasi momento                                      | consentire la modifica solo nel flusso conclusivo del Riposo Lungo                    |
| P1       | I pulsanti di lancio ignorano materiali costosi o consumati                                   | bloccare o consumare i materiali secondo l'inventario reale di Kaelen                 |
| P1       | I rituali hanno solo il normale pulsante che spende uno slot                                  | offrire un lancio rituale senza slot e con tempo aumentato di 10 minuti               |
| P1       | Il tracker dei TS morte non gestisce stabilità, morte, 1 naturale, 20 naturale o danni a 0 PF | implementare l'intero stato di Kaelen a 0 PF                                          |
| P1       | Incanalare Divinità è etichettato come se entrambi gli usi tornassero al Riposo Breve         | mostrare “+1 uso / Riposo Breve; tutti / Riposo Lungo”                                |
| P2       | L'Attacco di Opportunità richiede che il movimento sia “volontario”                           | usare il vero innesco basato sull'uso di movimento/azione, con le esclusioni corrette |
| P2       | La regola delle reazioni dice “fino al tuo turno”                                             | dire “fino all'inizio del tuo turno successivo”                                       |
| P2       | Alcune sintesi di incantesimo omettono casi utili o hanno metadati errati                     | applicare le correzioni elencate nella sezione Incantesimi                            |

La [mappa delle fonti](../../rules/kaelen-source-map.md) contiene pagine,
formule e ricerche rapide nei PDF.

## Confine della specifica

L'implementazione deve riconoscere un solo contratto: **Kaelen, Chierico puro
del Dominio della Tempesta**. Il livello 3 è lo stato attuale e completamente
determinato; i livelli 4-20 definiscono come deve scalare la sua magia senza
trasformare la scheda in un motore generico di D&D, un builder di classi o una
scheda riutilizzabile per altri personaggi.

Sono inclusi:

- valori derivati e attacchi di Kaelen;
- i 3 trucchetti, i 6 preparati iniziali, i 4 incantesimi del dominio e il pool
  di incantesimi da Chierico di livello 1-2;
- il numero di trucchetti, preparati, incantesimi del dominio e slot di Kaelen
  per ogni livello da Chierico fino al 20;
- PF, PF temporanei, dadi vita, TS morte, slot, preparazione, materiali,
  Incanalare Divinità, Ira della Tempesta, Storm's Thunder e Ispirazione;
- Riposo Breve e Riposo Lungo;
- testi operativi necessari a non applicare male una regola al tavolo.

Non sono inclusi:

- l'attivazione anticipata di capacità future: la tabella di progressione
  descrive ciò che la scheda dovrà applicare solo dopo un vero passaggio di
  livello;
- la scelta automatica di talenti, aumenti di caratteristica, nuovi trucchetti
  o nuovi preparati ai livelli futuri;
- multiclasse, altri domini, altre specie o altri punteggi;
- creazione generica di background;
- inventario completo dei manuali;
- un initiative tracker o l'automazione dei turni dei nemici;
- la risoluzione automatica dei tiri: i dadi continuano a essere tirati al
  tavolo e la scheda registra il risultato.

## Contratto immutabile del personaggio

Questi dati sono input canonici. I valori a destra sono output da calcolare,
non duplicati da mantenere a mano.

| Area            | Input di Kaelen                               | Output obbligatorio                                               |
| --------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Identità        | Goliath Medio, Chierico 3, Tempesta           | qualifica esatta in testata                                       |
| Caratteristiche | For 16, Des 12, Cos 13, Int 10, Sag 16, Car 8 | modificatori +3, +1, +1, +0, +3, -1                               |
| Competenza      | +2; TS Sag e Car                              | TS Sag +5, Car +1                                                 |
| Vitalità        | d8, Cos +1, tre livelli                       | 21 PF, 3d8                                                        |
| Difesa          | cotta di maglia, scudo                        | CA 18; CA 16 senza scudo                                          |
| Magia           | Saggezza                                      | attacco +5, CD 13                                                 |
| Mobilità        | Goliath                                       | 35 ft                                                             |
| Ascendenza      | Gigante della Tempesta                        | Storm's Thunder 2/Riposo Lungo                                    |
| Dominio         | Tempesta 2014 su Chierico 2024                | capacità di livello 3 o inferiore adattate alla progressione 2024 |

Tutti i calcoli devono restare in `src/lib/derive.ts`. I file di contenuto
contengono soltanto gli input e le sintesi leggibili.

## Attacchi ed equipaggiamento

### Maglio e scudo

La modalità normale è maglio a una mano più scudo: `+5` per colpire, `1d8+3`
contundenti, portata 5 ft e CA 18. La modalità a due mani è disponibile solo
quando Kaelen non impugna lo scudo: stesso `+5`, `1d10+3` e CA 16.

La proprietà Push del Warhammer non deve comparire come effetto applicabile:
Protettore dà competenza nell'arma, non Weapon Mastery.

### Colpo senz'armi

La card deve distinguere tre scelte:

1. **Danno:** `+5` per colpire, 4 contundenti;
2. **Afferrare:** TS Forza o Destrezza scelto dal bersaglio, CD 13; serve una
   mano libera e il bersaglio può essere al massimo Grande;
3. **Spingere:** stesso TS CD 13; sposta di 5 ft o rende Prono; bersaglio al
   massimo Grande.

### Mani occupate e componenti

Il simbolo sacro di Kaelen è un amuleto indossato da 5 mo. Può soddisfare il
focus senza essere impugnato, ma non crea una mano libera per la componente
Somatica. Quando Kaelen tiene maglio e scudo, un incantesimo con `S` richiede
che liberi prima la mano del maglio. Gli incantesimi solo Verbali, come Comando
e Parola Guaritrice, restano lanciabili a mani occupate.

La UI deve presentare questa come indicazione operativa; non deve tentare di
dedurre automaticamente in ogni istante cosa Kaelen stia tenendo.

## Incantesimi di Kaelen

### Preparare non significa consumare

La scheda deve tenere distinti quattro numeri:

1. **Trucchetti conosciuti:** sono sempre disponibili e non consumano slot;
   Kaelen può lanciarli ogni volta che dispone del tempo di lancio richiesto.
2. **Incantesimi preparati da Chierico:** sono le opzioni di livello 1+ fra cui
   può scegliere, non un numero di utilizzi. Lo stesso preparato può essere
   lanciato più volte.
3. **Incantesimi del Dominio:** sono sempre preparati e si aggiungono alle
   opzioni, ma non concedono slot aggiuntivi.
4. **Slot:** ogni lancio normale di un incantesimo di livello 1+ consuma uno
   slot di livello pari o superiore. Sono gli slot, non i preparati, a stabilire
   quanti lanci normali restano prima del Riposo Lungo.

Al livello 3 Kaelen conosce quindi **3 trucchetti senza limite**, ha **10
incantesimi di livello 1+ disponibili** (6 scelti + 4 del dominio) e può
effettuare al massimo **6 lanci normali con slot** fra due Riposi Lunghi: 4 con
slot di 1° e 2 con slot di 2°. Potrebbe, per esempio, lanciare sei volte lo
stesso incantesimo di 1° usando anche i due slot di 2°, purché restino valide
preparazione, componenti e concentrazione.

I sei lanci non comprendono rituali, oggetti magici, Incanalare Divinità o
altre capacità che non spendono slot.

### Insiemi validi

**Trucchetti sempre disponibili:** Guida, Fiamma Sacra, Taumaturgia.

**Sei preparati iniziali:** Benedizione, Comando, Cura Ferite, Parola
Guaritrice, Aiuto, Blocca Persone.

**Dominio sempre preparato e fuori dal limite di sei:** Nube di Nebbia, Onda
Tonante, Folata di Vento, Frantumare.

Il pool preparabile deve contenere soltanto i 32 incantesimi di livello 1-2
della lista del Chierico 2024 già presenti in `src/content/spells/`, esclusi i
quattro del dominio. Non sono ammessi slug arbitrari.

### Preparazione

Al termine di un Riposo Lungo valido:

1. recuperare PF, dadi vita, slot e risorse;
2. aprire una **sessione di preparazione** con una copia dei sei preparati
   correnti;
3. permettere di sostituire qualsiasi numero dei sei, senza mai superare o
   scendere sotto sei alla conferma;
4. mostrare trucchetti e dominio come “sempre preparati”, senza checkbox;
5. salvare i nuovi sei solo con “Conferma preparati”.

Fuori da questa sessione l'archivio resta consultabile, ma le checkbox sono in
sola lettura. Serve un comando esplicito “Modifica concessa dal DM” per
correggere errori manuali senza fingere che la regola lo permetta.

Annullare la finestra non deve lasciare una lista intermedia di cinque o sette
incantesimi.

### Lancio con slot

Kaelen ha quattro slot di 1° e due di 2°. Un incantesimo di 1° può usare uno
slot di 1° o 2°; uno di 2° usa soltanto uno slot di 2°. I trucchetti non
consumano slot.

Il pulsante di lancio deve:

- verificare che l'incantesimo sia preparato o sempre preparato;
- verificare uno slot disponibile del livello scelto;
- verificare le componenti materiali specifiche;
- consumare materiale e slot in una sola transazione, oppure nessuno dei due;
- mostrare per 5 secondi un annullamento che ripristina sia slot sia materiale;
- non nascondere la card quando gli slot finiscono, perché il testo resta
  consultabile.

La regola “un solo incantesimo con slot per turno” resta dichiarativa finché la
scheda non introduce un confine affidabile di turno. Il testo obbligatorio è:
“Nel tuo turno puoi spendere un solo slot: Parola Guaritrice + Fiamma Sacra sì;
Parola Guaritrice + Benedizione no.” Non aggiungere un blocco persistente che
potrebbe sopravvivere per errore al turno.

Il limite è per **turno**, non per Riposo Lungo e non per incantesimo. Spendere
uno slot per Parola Guaritrice impedisce di spenderne un secondo nello stesso
turno, ma non impedisce Fiamma Sacra perché è un trucchetto. Nel turno seguente
Kaelen può spendere un altro slot, se ne resta uno.

### Rituali

I rituali disponibili nel pool di Kaelen sono Individuazione del Magico,
Individuazione di Veleni e Malattie, Purificare Cibo e Bevande, Presagio,
Riposo Tranquillo e Silenzio.

Quando uno di questi è preparato, la card offre due azioni distinte:

- **Lancia con slot**, usando il tempo normale;
- **Lancia come rituale**, senza slot e con 10 minuti aggiunti al tempo.

Un rituale non preparato non è lanciabile. L'azione rituale deve comunque
verificare e consumare gli eventuali materiali.

Il numero di rituali non ha un limite giornaliero proprio: Kaelen può ripeterli
finché dispone di tempo, componenti e della preparazione richiesta. Durante i
10 minuti aggiuntivi deve mantenere Concentrazione; se la perde, il rituale
fallisce senza consumare slot. Slot e materiali consumabili vanno sottratti
soltanto al completamento del lancio, in una singola transazione.

### Progressione della capacità magica

Questa tabella è il contratto per un Kaelen **sempre monoclasse Chierico**. La
colonna “pronti” somma i preparati scelti e quelli del Dominio, ma esclude i
trucchetti. “Lanci con slot” è la somma degli slot e indica il massimo teorico
fra due Riposi Lunghi; non comprende rituali o lanci gratuiti.

| Livello | Bonus competenza | Trucchetti | Preparati scelti | Dominio | Pronti 1+ | Slot per livello                         | Lanci con slot |
| ------: | :--------------: | ---------: | ---------------: | ------: | --------: | ---------------------------------------- | -------------: |
|       3 |        +2        |          3 |                6 |       4 |        10 | 1°: 4, 2°: 2                             |              6 |
|       4 |        +2        |          4 |                7 |       4 |        11 | 1°: 4, 2°: 3                             |              7 |
|       5 |        +3        |          4 |                9 |       6 |        15 | 1°: 4, 2°: 3, 3°: 2                      |              9 |
|       6 |        +3        |          4 |               10 |       6 |        16 | 1°: 4, 2°: 3, 3°: 3                      |             10 |
|       7 |        +3        |          4 |               11 |       8 |        19 | 1°: 4, 2°: 3, 3°: 3, 4°: 1               |             11 |
|       8 |        +3        |          4 |               12 |       8 |        20 | 1°: 4, 2°: 3, 3°: 3, 4°: 2               |             12 |
|       9 |        +4        |          4 |               14 |      10 |        24 | 1°: 4, 2°: 3, 3°: 3, 4°: 3, 5°: 1        |             14 |
|      10 |        +4        |          5 |               15 |      10 |        25 | 1°: 4, 2°: 3, 3°: 3, 4°: 3, 5°: 2        |             15 |
|      11 |        +4        |          5 |               16 |      10 |        26 | 1°: 4, 2°: 3, 3°: 3, 4°: 3, 5°: 2, 6°: 1 |             16 |
|      12 |        +4        |          5 |               16 |      10 |        26 | 1°: 4, 2°: 3, 3°: 3, 4°: 3, 5°: 2, 6°: 1 |             16 |
|      13 |        +5        |          5 |               17 |      10 |        27 | 4/3/3/3/2/1/1                            |             17 |
|      14 |        +5        |          5 |               17 |      10 |        27 | 4/3/3/3/2/1/1                            |             17 |
|      15 |        +5        |          5 |               18 |      10 |        28 | 4/3/3/3/2/1/1/1                          |             18 |
|      16 |        +5        |          5 |               18 |      10 |        28 | 4/3/3/3/2/1/1/1                          |             18 |
|      17 |        +6        |          5 |               19 |      10 |        29 | 4/3/3/3/2/1/1/1/1                        |             19 |
|      18 |        +6        |          5 |               20 |      10 |        30 | 4/3/3/3/3/1/1/1/1                        |             20 |
|      19 |        +6        |          5 |               21 |      10 |        31 | 4/3/3/3/3/2/1/1/1                        |             21 |
|      20 |        +6        |          5 |               22 |      10 |        32 | 4/3/3/3/3/2/2/1/1                        |             22 |

Dalla riga 13 in poi la sequenza compatta elenca gli slot dal 1° livello in
avanti: `4/3/3/3/2/1/1` significa quattro slot di 1°, tre di 2°, tre di 3° e
così via fino a uno di 7°.

La UI del passaggio di livello deve applicare solo la riga raggiunta. Quando il
numero dei preparati aumenta, apre una bozza che richiede esattamente il nuovo
totale. Al livello 4 e al livello 10 aggiunge rispettivamente un nuovo
trucchetto; a ogni livello da Chierico permette inoltre di sostituire un solo
trucchetto già conosciuto. Nessun nome futuro viene scelto automaticamente.

### Progressione dei trucchetti attuali

- **Guida** e **Taumaturgia** non aumentano il numero di lanci: restano senza
  limite e applicano il testo dell'incantesimo.
- **Fiamma Sacra** infligge `1d8` ai livelli 3-4, `2d8` ai livelli 5-10, `3d8`
  ai livelli 11-16 e `4d8` dal livello 17.
- Al livello 7 Kaelen deve scegliere una sola opzione di Benedetto negli
  Attacchi. Se sceglie Incantesimi Potenti, aggiunge Saggezza ai danni dei
  trucchetti da Chierico; questa scelta non è ancora canonica e non deve essere
  attivata in anticipo. Il vecchio Colpo Divino del Dominio non si somma.

### Progressione degli incantesimi del Dominio

Gli incantesimi del Dominio sono sempre preparati e usano gli stessi slot di
ogni altro incantesimo. La scheda aggiunge soltanto le coppie raggiunte:

| Livello da Chierico | Nuovi incantesimi sempre preparati                        | Totale Dominio |
| ------------------: | --------------------------------------------------------- | -------------: |
|                   3 | Nube di Nebbia, Onda Tonante, Folata di Vento, Frantumare |              4 |
|                   5 | Invocare il Fulmine, Tempesta di Nevischio                |              6 |
|                   7 | Controllare Acqua, Tempesta di Ghiaccio                   |              8 |
|                   9 | Onda Distruttiva, Piaga degli Insetti                     |             10 |

Quando esiste una versione 2024 dell'incantesimo, la scheda usa quella
versione anche se l'elenco del Dominio proviene dal 2014.

### Lanci senza slot ai livelli futuri

Dal livello 10 Intervento Divino concede, una volta per Riposo Lungo, il lancio
come Azione Magica di un incantesimo da Chierico di livello 5 o inferiore,
senza slot, senza componenti materiali e senza che debba essere tra i preparati.
Questo lancio si aggiunge al totale della tabella e deve avere un contatore
separato.

Al livello 20 Intervento Divino può scegliere anche Desiderio. Dopo questa
scelta la capacità non torna al Riposo Lungo successivo, ma solo dopo `2d4`
Riposi Lunghi registrati. Non va sommato come ventitreesimo slot.

### Materiali nel caso iniziale

| Incantesimo                    | Comportamento richiesto                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Benedizione                    | lanciabile: l'amuleto soddisfa il simbolo sacro da 5 mo                                            |
| Protezione dal Male e dal Bene | lanciabile una volta; consuma `acqua-santa`                                                        |
| Presagio                       | bloccato finché non esiste un oggetto divinatorio da almeno 25 mo                                  |
| Fiamma Perenne                 | bloccato finché non esistono 50 mo di polvere di rubino; poi la consuma                            |
| Riposo Tranquillo              | bloccato con 0 mr; ogni lancio consuma 2 mr                                                        |
| Legame Protettivo              | bloccato finché non sono registrati due anelli di platino da almeno 50 mo ciascuno; non li consuma |

La presenza di abbastanza monete non equivale automaticamente al possesso di
polvere, anelli o strumenti divinatori.

### Correzioni di contenuto obbligatorie

- **Guida:** il bersaglio è una creatura consenziente; Kaelen può scegliere se
  stesso, non soltanto un alleato.
- **Taumaturgia:** fino a tre effetti da 1 minuto possono restare attivi
  contemporaneamente.
- **Comando:** durata `Istantanea`, non `1 turno`; l'esecuzione avviene nel
  turno successivo del bersaglio.
- **Onda Tonante:** oltre alle creature spinge di 10 ft gli oggetti non fissati
  interamente nell'area.
- **Frantumare:** danneggia anche gli oggetti non magici nell'area che non sono
  indossati o trasportati.
- **Folata di Vento:** il TS si applica quando la creatura è nella linea alla
  creazione e quando termina il turno nella linea; non a ogni semplice
  attraversamento.

Le formule attuali di danno e cura dei tredici incantesimi inizialmente visibili
sono corrette per Saggezza 16 e livello 3.

## Concentrazione

Kaelen può mantenere un solo incantesimo con Concentrazione. La scheda deve
registrare al massimo uno slug in `concentrazioneSu`.

- Lanciare un nuovo incantesimo con Concentrazione chiede conferma e termina il
  precedente.
- Quando Kaelen subisce danni mentre concentra, la UI mostra `TS Cos +1` e la
  CD `max(10, floor(danno / 2))`.
- Il risultato del tiro resta manuale: “Mantieni” conserva lo slug, “Fallito”
  lo rimuove.
- Arrivare a 0 PF, diventare Incapacitato, morire o iniziare un Riposo Lungo
  termina automaticamente la concentrazione.

Il lancio di Benedizione seguito da Blocca Persone deve quindi sostituire la
concentrazione, non mantenerle entrambe.

## Risorse del Chierico e della Tempesta

### Incanalare Divinità

Esiste un solo contatore condiviso da 2 usi per Scintilla Divina, Scacciare Non
Morti e Ira Distruttiva. Spendere una delle tre opzioni sottrae un uso allo
stesso contatore. La scelta dell'opzione serve soltanto allo storico visivo;
non crea tre risorse separate.

Recupero:

- Riposo Breve: recupera un solo uso, fino al massimo di 2;
- Riposo Lungo: recupera tutti gli usi.

Scintilla Divina usa CD 13 e `1d8+3`; Scacciare Non Morti usa CD 13; Ira
Distruttiva non richiede azione e massimizza tutti i dadi di una singola
istanza di danno da fulmine o tuono.

| Effetto con Ira Distruttiva | Fallimento TS | Successo TS |
| --------------------------- | ------------: | ----------: |
| Onda Tonante con slot 1°    |            16 |           8 |
| Onda Tonante con slot 2°    |            24 |          12 |
| Frantumare con slot 2°      |            24 |          12 |
| Ira della Tempesta          |            16 |           8 |

### Reazioni

Kaelen ha una sola Reazione tra l'inizio di un suo turno e l'inizio del
successivo.

| Reazione               | Innesco specifico                                                                              | Risorsa                     |
| ---------------------- | ---------------------------------------------------------------------------------------------- | --------------------------- |
| Ira della Tempesta     | una creatura vista entro 5 ft colpisce Kaelen con un attacco                                   | 1 dei 3 usi dedicati        |
| Storm's Thunder        | Kaelen subisce danni da una creatura entro 60 ft                                               | 1 dei 2 usi dedicati        |
| Attacco di Opportunità | una creatura vista lascia la portata di 5 ft usando movimento, Azione, Azione Bonus o Reazione | nessuna oltre alla Reazione |

L'Attacco di Opportunità avviene prima che il bersaglio lasci la portata. Non
si innesca con Disimpegno, teletrasporto o movimento che non usa movimento,
Azione, Azione Bonus o Reazione. “Volontariamente” non è un criterio valido:
un movimento imposto che usa la Reazione del bersaglio può ancora provocarlo.

La scheda non deve spendere automaticamente una Reazione, perché non conosce
l'inizio del turno di Kaelen. Deve però mostrare l'avviso completo accanto alle
tre opzioni.

#### Quante reazioni può usare

La quantità della risorsa e la disponibilità della Reazione sono due limiti
diversi. Kaelen recupera **una sola Reazione** all'inizio di ogni proprio turno:
se usa Ira della Tempesta, non può usare Tuono della Tempesta o un Attacco di
Opportunità prima dell'inizio del turno successivo, anche se ne conserva gli
usi.

| Reazione               | Numero di usi                           | Scalata valida per Kaelen                                     |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------- |
| Ira della Tempesta     | modificatore di Saggezza / Riposo Lungo | 3 ora; 4 con Saggezza 18; 5 con Saggezza 20                   |
| Tuono della Tempesta   | bonus di competenza / Riposo Lungo      | 2 ai livelli 3-4; 3 ai 5-8; 4 ai 9-12; 5 ai 13-16; 6 ai 17-20 |
| Attacco di Opportunità | nessun contatore giornaliero            | limitato dall'innesco e dalla Reazione disponibile            |

Ira della Tempesta resta `2d8` e Tuono della Tempesta resta `1d8`: aumentano
gli usi quando cresce la statistica collegata, non i dadi di danno. L'aumento
di Saggezza al livello 4 è una possibilità annotata dal DM, non ancora una
scelta avvenuta; il contatore deve derivare dal punteggio reale salvato.

Le tre reazioni attuali non sono incantesimi e non consumano slot. Se in futuro
Kaelen ottiene un incantesimo con tempo di lancio Reazione, quel lancio compete
per la stessa unica Reazione e consuma uno slot, ma solo nel turno in cui viene
innescato.

## PF, dadi vita e morte

### Danni e PF temporanei

- I PF temporanei assorbono il danno prima dei PF normali.
- Una nuova fonte di PF temporanei sostituisce o lascia il valore esistente; i
  due valori non si sommano.
- La cura non ripristina PF temporanei e non supera 21 PF.
- Il Riposo Lungo azzera i PF temporanei.

### Dadi vita e Riposo Breve

Kaelen ha 3d8. Un Riposo Breve valido richiede almeno 1 PF. Per ogni dado speso
il giocatore inserisce il totale già comprensivo di Costituzione: `1d8+1`,
minimo 1 PF. Dopo ogni dado può decidere se spenderne un altro.

Il pulsante non deve poter spendere dadi se Kaelen è a 0 PF o se tutti i 3d8
sono già spesi.

### Stato a 0 PF

Quando il danno porta Kaelen a 0 PF, calcolare prima la morte istantanea: se il
danno rimanente dopo lo zero è almeno 21, lo stato diventa `morto`. Altrimenti
diventa `incosciente` e inizia i TS morte.

| Esito del d20    | Effetto                                           |
| ---------------- | ------------------------------------------------- |
| 2-9              | +1 fallimento                                     |
| 10-19            | +1 successo                                       |
| 1 naturale       | +2 fallimenti                                     |
| 20 naturale      | Kaelen torna a 1 PF e azzera entrambi i contatori |
| terzo successo   | stato `stabile`, contatori azzerati               |
| terzo fallimento | stato `morto`                                     |

Danno normale subito a 0 PF aggiunge un fallimento; un colpo critico ne
aggiunge due; un singolo danno di almeno 21 uccide Kaelen. Qualsiasi cura che
lo porti sopra 0 azzera i contatori e lo rende cosciente.

Un personaggio stabile a 0 PF non tira TS morte. Se subisce danni torna
incosciente e applica il fallimento; se non viene curato recupera 1 PF dopo
`1d4` ore, evento registrato manualmente.

## Riposi

### Riposo Breve

Precondizione: Kaelen ha almeno 1 PF. Alla conclusione:

- recupera esattamente un uso speso di Incanalare Divinità;
- non recupera automaticamente PF o slot;
- non recupera Ira della Tempesta o Storm's Thunder;
- non modifica Ispirazione Eroica;
- registra soltanto i dadi vita che il giocatore ha scelto di spendere.

### Riposo Lungo

Precondizione: Kaelen ha almeno 1 PF. Alla conclusione:

- PF a 21, PF temporanei a 0, TS morte azzerati e stato cosciente;
- **tutti i 3d8 disponibili**, qualunque fosse il numero speso;
- slot a 4 di 1° e 2 di 2°;
- Incanalare Divinità 2/2;
- Ira della Tempesta 3/3;
- Storm's Thunder 2/2;
- concentrazione terminata;
- Ispirazione Eroica invariata;
- apertura della sessione atomica di preparazione descritta sopra.

La conferma deve dire esplicitamente che recupera tutti i dadi vita. Non deve
promettere di ripristinare campi che la scheda non traccia.

## Stato persistente richiesto

`StatoSessione` conserva soltanto dati reali della sessione di Kaelen:

```text
pf: 0..21
pfTemporanei: >= 0
dadiVitaSpesi: 0..3
statoVitale: cosciente | incosciente | stabile | morto
tsMorte: successi 0..2, fallimenti 0..2
slotSpesi: storico per ogni livello di slot disponibile
risorseUsate: incanalare 0..2, ira-tempesta 0..3, tuono-tempesta 0..2
preparati: esattamente 6 slug validi
concentrazioneSu: slug valido | null
materiali: quantità degli oggetti specifici posseduti
monete e oggetti
ispirazione: boolean
```

Il livello da Chierico, i trucchetti scelti e le altre decisioni permanenti del
passaggio di livello appartengono ai dati canonici di Kaelen, non allo stato di
sessione in `localStorage`. La sessione conserva soltanto il consumo delle
risorse derivato da quei dati.

La bozza di preparazione non deve essere salvata nello stato canonico finché
non è confermata. Un aggiornamento dello schema deve migrare ciò che è
inequivocabile e azzerare soltanto quando la migrazione non è sicura.

## Moduli responsabili

| Responsabilità                                                            | Sede                              |
| ------------------------------------------------------------------------- | --------------------------------- |
| valori derivati                                                           | `src/lib/derive.ts`               |
| transizioni di PF, morte, riposi, slot, risorse, preparazione e materiali | `src/lib/sheet-state.ts`          |
| disponibilità di slot e rituali                                           | `src/lib/lancio.ts`               |
| inventario canonico e capacità                                            | `src/content/character/kaelen.md` |
| metadati e sintesi degli incantesimi                                      | `src/content/spells/*.md`         |
| comandi di sessione                                                       | `src/islands/PannelloAzioni.tsx`  |
| lancio e annullamento                                                     | `src/islands/ControlliLancio.tsx` |
| bozza atomica dei preparati                                               | `src/islands/Archivio.tsx`        |

Non duplicare formule o regole di transizione nei componenti.

## Test di accettazione

### Valori statici

- Kaelen al livello 3 mostra PF 21, CA 18, CD 13, attacco incantesimi +5 e
  iniziativa +1.
- Togliendo lo scudo, la CA derivata è 16 e il maglio a due mani fa `1d10+3`.
- Tutti gli attacchi mostrano bonus e danni senza valori derivati duplicati nel
  contenuto.

### Quantità e progressione magica

- Al livello 3 la UI distingue 3 trucchetti illimitati, 10 incantesimi pronti e
  6 lanci massimi con slot `4/2`.
- Lanciare due volte Benedizione riduce gli slot disponibili di due, ma non
  rimuove Benedizione dai preparati.
- Esaurire tutti gli slot non disabilita trucchetti o rituali preparati.
- Al livello 5 la configurazione è 4 trucchetti, 9 preparati scelti, 6 del
  Dominio e slot `4/3/2`; Fiamma Sacra passa a `2d8`.
- Al livello 10 la configurazione è 5 trucchetti, 15 preparati scelti, 10 del
  Dominio e 15 slot totali; Intervento Divino conserva un uso separato.
- Al livello 20 la configurazione completa degli slot è `4/3/3/3/3/2/2/1/1`,
  per 22 lanci con slot, non 22 incantesimi differenti.
- Un passaggio di livello non sceglie autonomamente trucchetti, preparati,
  talenti o aumenti di caratteristica.

### Riposi e preparazione

- Dati 3 dadi vita spesi, un Riposo Lungo li riporta tutti disponibili.
- Dati 2 usi di Incanalare spesi, un Riposo Breve ne lascia 1 speso; un secondo
  Riposo Breve lascia 0.
- Un Riposo Breve non cambia slot, PF o le due risorse a recupero lungo.
- A 0 PF entrambi i riposi sono disabilitati con una spiegazione.
- Aprendo l'archivio durante la giornata, nessuna checkbox modifica lo stato.
- Dopo un Riposo Lungo si possono sostituire tutti e sei i preparati.
- La conferma fallisce se la bozza non contiene esattamente sei slug validi,
  distinti e non appartenenti a trucchetti o dominio.
- Annullare conserva integralmente la lista precedente.

### Lancio e materiali

- Benedizione consuma lo slot scelto e non consuma l'amuleto.
- Protezione dal Male e dal Bene consuma nello stesso gesto uno slot e l'unica
  Acqua Santa; Annulla ripristina entrambi.
- Fiamma Perenne, Presagio, Riposo Tranquillo e Legame Protettivo sono
  inizialmente bloccati con il motivo corretto.
- Individuazione del Magico preparato può essere lanciato come rituale senza
  modificare gli slot.
- Un rituale non preparato non offre alcuna azione di lancio.

### Concentrazione e morte

- Benedizione seguita da Blocca Persone termina Benedizione dopo conferma.
- Con 7 danni durante la concentrazione, la UI chiede TS Cos +1 CD 10; con 26
  danni chiede CD 13.
- Scendere a 0 PF rimuove automaticamente la concentrazione.
- A 5 PF, 26 danni lasciano un residuo di 21 e uccidono Kaelen; 25 danni lo
  lasciano incosciente a 0 PF.
- Un 1 naturale aggiunge due fallimenti; un 20 naturale porta a 1 PF.
- Tre successi rendono stabile e interrompono i tiri; tre fallimenti rendono
  morto; una cura azzera entrambi i contatori.

### Regressione

- `npm run gate` passa.
- La pagina resta utilizzabile a 390×844.
- La sessione salvata sopravvive a un reload quando la versione dei dati non
  cambia.
- La scheda offline usa gli stessi dati e le stesse transizioni della versione
  online.

## Criterio di completamento

L'implementazione è conclusa quando tutti i test deterministici sopra sono
automatizzati, le sintesi corrette sono visibili nella UI e un controllo
manuale a 390×844 conferma che nessuna nuova informazione nasconde PF, CA, slot
o azioni di lancio.
