# Glossario italiano → inglese per la scheda di Kaelen

Questo file è il riferimento per i campi `nomeEn` e per le etichette inglesi
della scheda. L'inglese va copiato da qui con maiuscole, apostrofi e spaziatura
invariati: sono nomi regolamentari, non traduzioni libere.

## Ambito e fonti

La scheda combina:

- regole base, Chierico, Goliath, equipaggiamento e incantesimi del _Player's
  Handbook_ 2024;
- il Dominio della Tempesta del _Player's Handbook_ 2014, usato con il Chierico
  2024 secondo le regole di compatibilità;
- alcuni nomi propri o personalizzati di Kaelen, che non possono avere un nome
  ufficiale da manuale.

Legenda della colonna **Stato**:

- **2024**: titolo o termine verificato nel PHB 2024;
- **2014**: titolo verificato nel PHB 2014;
- **composto**: etichetta dell'interfaccia costruita unendo titoli ufficiali;
- **misto**: un titolo ufficiale seguito da una specifica propria della scheda;
- **personalizzato**: traduzione editoriale di contenuto che non esiste nel
  regolamento;
- **nome proprio**: nome invariato, non termine regolamentare.

Per l'implementazione, un valore **composto** è utilizzabile in `nomeEn`, ma non
va descritto come un singolo titolo stampato nel manuale. Un valore
**personalizzato** non deve essere usato come prova dell'esistenza di una regola.

## Identità del personaggio

| Italiano nel repo         | Inglese da usare      | Stato          | Nota                                             |
| ------------------------- | --------------------- | -------------- | ------------------------------------------------ |
| Goliath                   | Goliath               | 2024           | Nome della specie.                               |
| Media                     | Medium                | 2024           | Taglia.                                          |
| Chierico                  | Cleric                | 2024           | Classe.                                          |
| Dominio della Tempesta    | Tempest Domain        | 2014           | Sottoclasse del Chierico.                        |
| Caotico Buono             | Chaotic Good          | 2024           | Allineamento.                                    |
| Libero predone chondathan | Chondathan Freebooter | personalizzato | Background personalizzato, non titolo ufficiale. |
| Stronmaus                 | Stronmaus             | nome proprio   | Non tradurre.                                    |

## Caratteristiche e abilità

| Italiano         | Inglese ufficiale | Stato |
| ---------------- | ----------------- | ----- |
| Forza            | Strength          | 2024  |
| Destrezza        | Dexterity         | 2024  |
| Costituzione     | Constitution      | 2024  |
| Intelligenza     | Intelligence      | 2024  |
| Saggezza         | Wisdom            | 2024  |
| Carisma          | Charisma          | 2024  |
| Atletica         | Athletics         | 2024  |
| Rapidità di mano | Sleight of Hand   | 2024  |
| Intuizione       | Insight           | 2024  |
| Medicina         | Medicine          | 2024  |
| Percezione       | Perception        | 2024  |
| Religione        | Religion          | 2024  |
| Sopravvivenza    | Survival          | 2024  |

## Capacità, risorse e reazioni

| Italiano nel repo                         | Inglese da usare                    | Stato          | Nota                                                                |
| ----------------------------------------- | ----------------------------------- | -------------- | ------------------------------------------------------------------- |
| Ordine Divino                             | Divine Order                        | 2024           | Nome della capacità di classe.                                      |
| Protettore                                | Protector                           | 2024           | Opzione di Divine Order.                                            |
| Ordine Divino: Protettore                 | Divine Order: Protector             | composto       | Unisce due titoli ufficiali 2024.                                   |
| Incanalare Divinità                       | Channel Divinity                    | 2024           | Capacità e risorsa del Chierico.                                    |
| Scintilla Divina                          | Divine Spark                        | 2024           | Effetto di Channel Divinity.                                        |
| Incanalare Divinità: Scintilla Divina     | Channel Divinity: Divine Spark      | composto       | Etichetta UI formata da due nomi ufficiali.                         |
| Scacciare Non Morti                       | Turn Undead                         | 2024           | Effetto di Channel Divinity.                                        |
| Incanalare Divinità: Scacciare Non Morti  | Channel Divinity: Turn Undead       | composto       | Etichetta UI formata da due nomi ufficiali.                         |
| Competenze Bonus                          | Bonus Proficiencies                 | 2014           | Capacità del Tempest Domain; nella scheda è assorbita da Protector. |
| Ira della Tempesta                        | Wrath of the Storm                  | 2014           | Capacità e reazione del Tempest Domain.                             |
| Ira Distruttiva                           | Destructive Wrath                   | 2014           | Effetto di Channel Divinity del Tempest Domain.                     |
| Incanalare Divinità: Ira Distruttiva      | Channel Divinity: Destructive Wrath | 2014           | Titolo completo della capacità.                                     |
| Ascendenza Gigante                        | Giant Ancestry                      | 2024           | Tratto del Goliath.                                                 |
| Tuono della Tempesta                      | Storm's Thunder                     | 2024           | Beneficio Storm Giant di Giant Ancestry. Usare l'apostrofo ASCII.   |
| Corporatura Possente                      | Powerful Build                      | 2024           | Tratto del Goliath.                                                 |
| Ascendenza Gigante e Corporatura Possente | Giant Ancestry & Powerful Build     | composto       | La card raggruppa due tratti distinti.                              |
| Regole degli incantesimi                  | Spellcasting Rules                  | personalizzato | Titolo editoriale della card, non capacità di classe.               |
| Attacco di Opportunità                    | Opportunity Attack                  | 2024           | Reazione delle regole generali.                                     |
| Skilled                                   | Skilled                             | 2024           | Talento di Origine; non tradurre nel campo inglese.                 |

## Armatura, attacchi ed equipaggiamento

### Armatura e attacchi

| Italiano nel repo          | Inglese da usare | Stato | Nota regolamentare                                                   |
| -------------------------- | ---------------- | ----- | -------------------------------------------------------------------- |
| Cotta di maglia            | Chain Mail       | 2024  | Heavy Armor.                                                         |
| Scudo                      | Shield           | 2024  | Shield.                                                              |
| Maglio da guerra           | Warhammer        | 2024  | Nome dell'oggetto nell'equipaggiamento.                              |
| Maglio da guerra, una mano | Warhammer        | 2024  | `1d8 Bludgeoning`; la modalità a una mano non fa parte del nome.     |
| Maglio da guerra, due mani | Warhammer        | 2024  | `1d10 Bludgeoning` tramite `Versatile (1d10)`; il nome resta uguale. |
| Colpo senz'armi            | Unarmed Strike   | 2024  | Non è il nome di un'arma.                                            |
| contundenti                | Bludgeoning      | 2024  | Tipo di danno.                                                       |
| Versatile (1d10)           | Versatile (1d10) | 2024  | Proprietà del Warhammer.                                             |
| Spingere                   | Shove            | 2024  | Opzione di Unarmed Strike.                                           |
| Afferrare                  | Grapple          | 2024  | Opzione di Unarmed Strike.                                           |

Il campo `nomeEn` di entrambe le righe del maglio deve quindi essere
`Warhammer`, non `One-Handed Warhammer` o `Two-Handed Warhammer`.

### Oggetti

| Italiano nel repo                     | Inglese da usare             | Stato | Nota                                                              |
| ------------------------------------- | ---------------------------- | ----- | ----------------------------------------------------------------- |
| Simbolo sacro: disco di pietra lavica | Holy Symbol: Lava-Stone Disk | misto | `Holy Symbol` è ufficiale; il tipo di disco è personalizzato.     |
| Strumenti da tessitore                | Weaver's Tools               | 2024  | Apostrofo singolare.                                              |
| Fiala di acqua santa                  | Holy Water                   | 2024  | Il titolo dell'oggetto è `Holy Water`; la fiala è il contenitore. |
| Razioni (giorni)                      | Rations (days)               | misto | `Rations` è ufficiale; `days` è l'unità usata dall'interfaccia.   |
| Lampada                               | Lamp                         | 2024  |                                                                   |
| Acciarino                             | Tinderbox                    | 2024  |                                                                   |
| Coperta                               | Blanket                      | 2024  |                                                                   |
| Sacco a pelo                          | Bedroll                      | 2024  |                                                                   |
| Veste                                 | Robe                         | 2024  |                                                                   |
| Vestiti da viaggio                    | Traveler's Clothes           | 2024  | Nel listino compare anche come `Clothes, Traveler's`.             |
| Borraccia                             | Waterskin                    | 2024  |                                                                   |
| Corda da 50 ft                        | Rope                         | 2024  | La lunghezza non fa parte del titolo dell'oggetto 2024.           |
| Zaino                                 | Backpack                     | 2024  |                                                                   |

### Lingue e monete

| Italiano                | Inglese ufficiale    | Stato |
| ----------------------- | -------------------- | ----- |
| Comune                  | Common               | 2024  |
| Gigante                 | Giant                | 2024  |
| Lingua dei Segni Comune | Common Sign Language | 2024  |
| moneta d'oro (mo)       | Gold Piece (GP)      | 2024  |
| moneta d'argento (ma)   | Silver Piece (SP)    | 2024  |
| moneta di rame (mr)     | Copper Piece (CP)    | 2024  |

## Incantesimi

I 39 valori `nomeEn` già presenti in `src/content/spells/` corrispondono ai
titoli inglesi del PHB 2024. Questa è la tabella completa da usare anche per
rinominare slug, riferimenti o etichette generate.

### Trucchetti

| Italiano     | Inglese ufficiale |
| ------------ | ----------------- |
| Fiamma Sacra | Sacred Flame      |
| Guida        | Guidance          |
| Taumaturgia  | Thaumaturgy       |

### 1° livello

| Italiano                            | Inglese ufficiale             |
| ----------------------------------- | ----------------------------- |
| Benedizione                         | Bless                         |
| Comando                             | Command                       |
| Creare o Distruggere Acqua          | Create or Destroy Water       |
| Cura Ferite                         | Cure Wounds                   |
| Dardo Guidato                       | Guiding Bolt                  |
| Iettatura                           | Bane                          |
| Individuazione del Magico           | Detect Magic                  |
| Individuazione del Male e del Bene  | Detect Evil and Good          |
| Individuazione di Veleni e Malattie | Detect Poison and Disease     |
| Infliggere Ferite                   | Inflict Wounds                |
| Nube di Nebbia                      | Fog Cloud                     |
| Onda Tonante                        | Thunderwave                   |
| Parola Guaritrice                   | Healing Word                  |
| Protezione dal Male e dal Bene      | Protection from Evil and Good |
| Purificare Cibo e Bevande           | Purify Food and Drink         |
| Santuario                           | Sanctuary                     |
| Scudo della Fede                    | Shield of Faith               |

### 2° livello

| Italiano                  | Inglese ufficiale      |
| ------------------------- | ---------------------- |
| Aiuto                     | Aid                    |
| Arma Spirituale           | Spiritual Weapon       |
| Blocca Persone            | Hold Person            |
| Calmare Emozioni          | Calm Emotions          |
| Cecità/Sordità            | Blindness/Deafness     |
| Fiamma Perenne            | Continual Flame        |
| Folata di Vento           | Gust of Wind           |
| Frantumare                | Shatter                |
| Individuare Trappole      | Find Traps             |
| Legame Protettivo         | Warding Bond           |
| Localizzare Oggetto       | Locate Object          |
| Potenziare Caratteristica | Enhance Ability        |
| Preghiera di Guarigione   | Prayer of Healing      |
| Presagio                  | Augury                 |
| Protezione dai Veleni     | Protection from Poison |
| Riposo Tranquillo         | Gentle Repose          |
| Ristorare Inferiore       | Lesser Restoration     |
| Silenzio                  | Silence                |
| Zona di Verità            | Zone of Truth          |

## Termini di regola ricorrenti

Usare questi valori quando un termine compare come etichetta autonoma. La prosa
italiana può restare italiana: il progetto non sta introducendo una seconda
localizzazione completa.

| Italiano                                | Inglese ufficiale     | Stato |
| --------------------------------------- | --------------------- | ----- |
| azione                                  | Action                | 2024  |
| Azione Bonus                            | Bonus Action          | 2024  |
| Azione Magica                           | Magic action          | 2024  |
| reazione                                | Reaction              | 2024  |
| tiro per colpire / tiro di attacco      | Attack Roll           | 2024  |
| tiro salvezza                           | Saving Throw          | 2024  |
| prova di caratteristica                 | Ability Check         | 2024  |
| Classe Armatura (CA)                    | Armor Class (AC)      | 2024  |
| Classe Difficoltà (CD)                  | Difficulty Class (DC) | 2024  |
| Punti Ferita (PF)                       | Hit Points (HP)       | 2024  |
| Punti Ferita massimi                    | Hit Point Maximum     | 2024  |
| Bonus di Competenza                     | Proficiency Bonus     | 2024  |
| Velocità                                | Speed                 | 2024  |
| competenza                              | Proficiency           | 2024  |
| armatura pesante                        | Heavy Armor           | 2024  |
| arma marziale                           | Martial Weapon        | 2024  |
| slot incantesimo                        | Spell Slot            | 2024  |
| caratteristica da incantatore           | Spellcasting Ability  | 2024  |
| CD degli incantesimi                    | Spell Save DC         | 2024  |
| modificatore di attacco con incantesimo | Spell Attack Modifier | 2024  |
| focus da incantatore                    | Spellcasting Focus    | 2024  |
| componente verbale                      | Verbal component      | 2024  |
| componente somatica                     | Somatic component     | 2024  |
| componente materiale                    | Material component    | 2024  |
| Concentrazione                          | Concentration         | 2024  |
| Riposo Breve                            | Short Rest            | 2024  |
| Riposo Lungo                            | Long Rest             | 2024  |
| Vantaggio                               | Advantage             | 2024  |
| Svantaggio                              | Disadvantage          | 2024  |
| Afferrato                               | Grappled              | 2024  |
| Assordato                               | Deafened              | 2024  |
| Incapacitato                            | Incapacitated         | 2024  |
| Spaventato                              | Frightened            | 2024  |
| Costrutto                               | Construct             | 2024  |
| Non Morto                               | Undead                | 2024  |
| Umanoide                                | Humanoid              | 2024  |
| fulmine                                 | Lightning             | 2024  |
| tuono                                   | Thunder               | 2024  |
| forza                                   | Force                 | 2024  |
| necrotico                               | Necrotic              | 2024  |
| radiante                                | Radiant               | 2024  |

## Regole d'uso per Claude Code

1. Cercare prima la stringa italiana in questo file; non ricostruire il nome
   inglese per traduzione letterale.
2. Per i campi `nomeEn`, usare solo la colonna **Inglese da usare** o
   **Inglese ufficiale**.
3. Non aggiungere qualificatori assenti dal titolo ufficiale: le due modalità
   del maglio restano entrambe `Warhammer`; la corda resta `Rope`.
4. Conservare esattamente `Storm's Thunder`, `Weaver's Tools` e
   `Traveler's Clothes`, inclusi apostrofi e plurali.
5. Non presentare `Chondathan Freebooter`, `Holy Symbol: Lava-Stone Disk` o
   `Giant Ancestry & Powerful Build` come titoli integrali del manuale.
6. Le descrizioni di capacità e incantesimi devono restare sintesi originali;
   questo glossario autorizza la trascrizione dei nomi, non della prosa dei
   manuali.

## Riferimenti di verifica

- `../tmp/pdfs/phb2024.txt`: estrazione locale del _Player's Handbook_ 2024.
  Punti principali: Chierico pp. 69–71; Goliath p. 192; armi p. 215; armature
  p. 219; strumenti p. 221; equipaggiamento d'avventura pp. 224–228; regole di
  lancio pp. 235–237; incantesimi nel capitolo 7.
- _Player's Handbook_ 2014, pp. 62–63: `Tempest Domain`, `Bonus
Proficiencies`, `Wrath of the Storm` e `Channel Divinity: Destructive
Wrath`.
- `../Kaelen_note_DM.md`: decisione del progetto sulla combinazione tra
  Chierico 2024 e Dominio della Tempesta 2014.
