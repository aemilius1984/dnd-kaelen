---
nome: Kaelen
specie: Goliath
taglia: Media
classe: Chierico
livello: 3
sottoclasse: Dominio della Tempesta
allineamento: Caotico Buono
divinita: Stronmaus
background: Libero predone chondathan
caratteristiche: { for: 16, des: 12, cos: 13, int: 10, sag: 16, car: 8 }
competenza: 2
caratteristicaIncantesimi: sag
tsCompetenti: [sag, car]
abilita:
  - { nome: Atletica, nomeEn: Athletics, caratteristica: for, origine: Background }
  - { nome: Rapidità di mano, nomeEn: Sleight of Hand, caratteristica: des, origine: Background }
  - { nome: Intuizione, nomeEn: Insight, caratteristica: sag, origine: Chierico }
  - { nome: Medicina, nomeEn: Medicine, caratteristica: sag, origine: Chierico }
  - { nome: Percezione, nomeEn: Perception, caratteristica: sag, origine: Skilled }
  - { nome: Religione, nomeEn: Religion, caratteristica: int, origine: Skilled }
  - { nome: Sopravvivenza, nomeEn: Survival, caratteristica: sag, origine: Skilled }
pfMax: 21
dadoVita: d8
numeroDadiVita: 3
velocita: 35
armatura:
  nome: Cotta di maglia
  nomeEn: Chain Mail
  ca: 16
  tipo: pesante
  scudo: 2
  note: Svantaggio alle prove di Destrezza (Furtività). Forza minima 13.
attacchi:
  - id: maglio-una-mano
    nome: Maglio da guerra
    nomeEn: Warhammer
    gruppo: maglio
    modo: una mano
    scudo: true
    caratteristica: for
    competente: true
    gittata: 5 ft
    proprieta: [Versatile (1d10)]
    danno: { dado: 1d8, fisso: 0 }
    tipoDanno: contundenti
    descrizione: >-
      Un martello da guerra a testa piena, arma marziale da mischia. Impugnato a
      una mano tira 1d8: è la forma base dell'arma, quella su cui la proprietà
      Versatile calcola il proprio aumento.
    note: Permette di usare lo scudo. Scelta normale.
  - id: maglio-due-mani
    nome: Maglio da guerra
    nomeEn: Warhammer
    gruppo: maglio
    modo: due mani
    scudo: false
    caratteristica: for
    competente: true
    gittata: 5 ft
    proprieta: [Versatile (1d10)]
    danno: { dado: 1d10, fisso: 0 }
    tipoDanno: contundenti
    descrizione: >-
      Lo stesso maglio stretto a due mani. È quello che concede la proprietà
      Versatile: il dado di danno sale da 1d8 a 1d10, e in cambio nessuna mano
      resta libera.
    note: Devi rinunciare allo scudo.
    avvertenze:
      - >-
        Con maglio e scudo impugnati, un incantesimo con componente Somatica
        chiede di liberare prima la mano del maglio. Comando e Parola Guaritrice
        sono solo verbali: restano lanciabili a mani occupate.
      - >-
        Protettore dà la competenza nell'arma, non la Maestria: la proprietà
        Push del Warhammer non si applica.
  - id: colpo-senzarmi
    nome: Colpo senz'armi
    nomeEn: Unarmed Strike
    modo: colpisci
    caratteristica: for
    competente: true
    gittata: 5 ft
    proprieta: []
    danno: { dado: null, fisso: 1 }
    tipoDanno: contundenti
    descrizione: >-
      Pugno, calcio o testata contro un bersaglio entro 5 ft. Non è un'arma e non
      ha un dado: infligge 1 danno più il modificatore di Forza.
    alternative:
      - nome: Afferra
        nomeEn: Grapple
        ts: Forza o Destrezza, sceglie il bersaglio
        effetto: >-
          Il bersaglio diventa Afferrato. Non tiri per colpire: è lui a tirare
          per liberarsi.
        limite: Serve una mano libera, e il bersaglio non può essere più che Grande.
      - nome: Spingi
        nomeEn: Shove
        ts: Forza o Destrezza, sceglie il bersaglio
        effetto: >-
          Lo sposti di 5 ft oppure lo rendi Prono: scegli tu quale dei due.
        limite: Il bersaglio non può essere più che Grande.
risorse:
  - id: incanalare
    nome: Incanalare Divinità
    nomeEn: Channel Divinity
    max: 2
    recupero: breve
    descrizione: >-
      L'energia che Stronmaus ti presta, due cariche che tornano con un Riposo
      Breve. È il carburante comune di Scintilla Divina, Scacciare Non Morti e
      Ira Distruttiva: spenderla per una la toglie alle altre.
    usi:
      - nome: Scintilla Divina
        nomeEn: Divine Spark
        paragrafi:
          - Azione Magica, creatura visibile entro 30 ft. Puoi guarirla di 1d8 + 3 PF.
          - >-
            In alternativa la creatura effettua un TS Costituzione, subendo 1d8 + 3 danni
            radianti o necrotici al fallimento e metà al successo. Non consuma slot.
      - nome: Scacciare Non Morti
        nomeEn: Turn Undead
        paragrafi:
          - Azione Magica. I non morti scelti entro 30 ft effettuano un TS Saggezza.
          - >-
            Chi fallisce è Spaventato e Incapacitato per 1 minuto e cerca di allontanarsi.
            L'effetto termina se subisce danni o se Kaelen diventa Incapacitato o muore.
      - nome: Ira Distruttiva
        nomeEn: Destructive Wrath
        paragrafi:
          - >-
            Quando dovresti tirare danni da fulmine o tuono, spendi un uso per usare il
            risultato massimo dei dadi. Non richiede un'azione.
          - >-
            L'impiego più efficace al 3° livello è Frantumare, 24 danni a chi fallisce il
            TS e 12 a chi riesce.
  - id: ira-tempesta
    nome: Ira della Tempesta
    nomeEn: Wrath of the Storm
    max: 3
    recupero: lungo
    descrizione: >-
      La risposta del dominio a chi ti colpisce corpo a corpo: il cielo lo punisce
      per te, con fulmine o tuono, prima ancora che tu abbia deciso come reagire.
      Tre usi per Riposo Lungo.
  - id: tuono-tempesta
    nome: Tuono della Tempesta
    nomeEn: Storm's Thunder
    max: 2
    recupero: lungo
    descrizione: >-
      L'eredità dei Giganti della Tempesta che ti scorre nel sangue: chi ti ferisce
      sente il rimbombo, anche da lontano e anche senza averti attaccato. Due usi
      per Riposo Lungo.
slot:
  - { livello: 1, max: 4 }
  - { livello: 2, max: 2 }
trucchetti: [guida, fiamma-sacra, taumaturgia]
preparatiIniziali: [benedizione, comando, cura-ferite, parola-guaritrice, aiuto, blocca-persone]
dominio: [nube-di-nebbia, onda-tonante, folata-di-vento, frantumare]
limitePreparati: 6
monete: { mo: 16, ma: 8, mr: 0 }
equipaggiamento:
  - {
      id: cotta-di-maglia,
      nome: Cotta di maglia,
      nomeEn: Chain Mail,
      quantita: 1,
      consumabile: false,
    }
  - { id: scudo, nome: Scudo, nomeEn: Shield, quantita: 1, consumabile: false }
  - { id: maglio, nome: Maglio da guerra, nomeEn: Warhammer, quantita: 1, consumabile: false }
  - {
      id: simbolo-sacro,
      nome: 'Simbolo sacro: disco di pietra lavica',
      nomeEn: 'Holy Symbol: Lava-Stone Disk',
      quantita: 1,
      consumabile: false,
      note: 'Focus da incantatore, indossato sul petto.',
    }
  - {
      id: strumenti-tessitore,
      nome: Strumenti da tessitore,
      nomeEn: Weaver's Tools,
      quantita: 1,
      consumabile: false,
    }
  - {
      id: acqua-santa,
      nome: Fiala di acqua santa,
      nomeEn: Holy Water,
      quantita: 1,
      consumabile: true,
    }
  - { id: razioni, nome: Razioni (giorni), nomeEn: Rations (days), quantita: 7, consumabile: true }
  - { id: lampada, nome: Lampada, nomeEn: Lamp, quantita: 1, consumabile: false }
  - { id: acciarino, nome: Acciarino, nomeEn: Tinderbox, quantita: 1, consumabile: false }
  - { id: coperta, nome: Coperta, nomeEn: Blanket, quantita: 1, consumabile: false }
  - { id: sacco-a-pelo, nome: Sacco a pelo, nomeEn: Bedroll, quantita: 1, consumabile: false }
  - { id: veste, nome: Veste, nomeEn: Robe, quantita: 1, consumabile: false }
  - {
      id: vestiti-viaggio,
      nome: Vestiti da viaggio,
      nomeEn: Traveler's Clothes,
      quantita: 1,
      consumabile: false,
    }
  - { id: borraccia, nome: Borraccia, nomeEn: Waterskin, quantita: 1, consumabile: false }
  - { id: corda, nome: Corda da 50 ft, nomeEn: Rope, quantita: 1, consumabile: false }
  - { id: zaino, nome: Zaino, nomeEn: Backpack, quantita: 1, consumabile: false }
lingue: [Comune, Gigante, Lingua dei Segni Comune]
strumenti:
  - { nome: Strumenti da tessitore, nomeEn: Weaver's Tools, caratteristica: des, competente: true }
capacita:
  - titolo: 'Ordine Divino: Protettore'
    paragrafi:
      - Kaelen è addestrato nelle armature pesanti e negli scudi ed è competente nelle armi marziali.
      - Le competenze simili del Dominio della Tempesta non si sommano e non forniscono altri bonus.
  - titolo: Ascendenza Gigante e Corporatura Possente
    paragrafi:
      - Tuono della Tempesta deriva dall'ascendenza dei Giganti della Tempesta ed è la reazione descritta sotto.
      - Corporatura Possente dà Vantaggio ai tiri salvezza per terminare la condizione Afferrato e conta come una taglia più grande per la capacità di trasporto.
  - titolo: Regole degli incantesimi
    paragrafi:
      - I sei incantesimi preparati si possono sostituire con altri incantesimi da Chierico al termine di un Riposo Lungo. I quattro del dominio restano sempre preparati.
      - Durante un turno puoi spendere al massimo uno slot. Parola Guaritrice come Azione Bonus e Fiamma Sacra come Azione sono compatibili; Parola Guaritrice e Benedizione no.
      - Puoi mantenere un solo incantesimo con Concentrazione. Quando subisci danni, TS Costituzione con CD 10 oppure metà dei danni ricevuti, il valore più alto.
      - Il simbolo sacro sostituisce le componenti materiali prive di costo e non consumate.
      - "Un incantesimo non distingue amici e nemici: controlla l'area di Onda Tonante e Frantumare prima di lanciarli."
reazioni:
  - nome: Ira della Tempesta
    nomeEn: Wrath of the Storm
    innesco: Una creatura che vedi entro 5 ft ti colpisce con un attacco.
    effetto: TS Destrezza, 2d8 fulmine o tuono, metà se riesce. Tre usi per Riposo Lungo.
    risorsa: ira-tempesta
  - nome: Tuono della Tempesta
    nomeEn: Storm's Thunder
    innesco: Subisci danni da una creatura entro 60 ft.
    effetto: Quella creatura subisce 1d8 danni da tuono, senza TS. Due usi per Riposo Lungo.
    risorsa: tuono-tempesta
  - nome: Attacco di Opportunità
    nomeEn: Opportunity Attack
    innesco: >-
      Una creatura che vedi lascia la tua portata di 5 ft usando movimento, Azione,
      Azione Bonus o Reazione.
    effetto: >-
      Un attacco di maglio, prima che esca dalla portata. Non si innesca con
      Disimpegno, teletrasporto, o movimento che non spende nessuna di quelle quattro
      cose.
interpretazione:
  tratto: Attaccabrighe gioviale e rumoroso, ripara reti e vestiti quando deve riflettere.
  ideale: La forza serve a proteggere la libertà altrui.
  legame: Recuperare Thuunvar e riportarlo ai Vaerak-Thuun. I compagni sono la sua nuova ciurma.
  difetto: Scambia troppo spesso il coraggio per l'impossibilità di arretrare.
  paura: Teme ancora di sentire Talos nel tuono.
---

Dopo aver usato una Reazione, Kaelen non può usarne un'altra fino all'inizio del proprio
turno successivo. Usa Ira della Tempesta contro un aggressore vicino, perché infligge più
danni; conserva Tuono della Tempesta per chi ti danneggia da lontano o senza attaccare.
