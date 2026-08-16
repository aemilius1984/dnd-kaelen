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
  - { nome: Atletica, caratteristica: for, origine: Background }
  - { nome: Rapidità di mano, caratteristica: des, origine: Background }
  - { nome: Intuizione, caratteristica: sag, origine: Chierico }
  - { nome: Medicina, caratteristica: sag, origine: Chierico }
  - { nome: Percezione, caratteristica: sag, origine: Skilled }
  - { nome: Religione, caratteristica: int, origine: Skilled }
  - { nome: Sopravvivenza, caratteristica: sag, origine: Skilled }
pfMax: 21
dadoVita: d8
numeroDadiVita: 3
velocita: 35
armatura:
  nome: Cotta di maglia
  ca: 16
  tipo: pesante
  scudo: 2
  note: Svantaggio alle prove di Destrezza (Furtività). Forza minima 13.
attacchi:
  - id: maglio-una-mano
    nome: Maglio da guerra, una mano
    caratteristica: for
    competente: true
    danno: { dado: 1d8, fisso: 0 }
    tipoDanno: contundenti
    note: Permette di usare lo scudo. Scelta normale.
  - id: maglio-due-mani
    nome: Maglio da guerra, due mani
    caratteristica: for
    competente: true
    danno: { dado: 1d10, fisso: 0 }
    tipoDanno: contundenti
    note: Devi rinunciare allo scudo, la CA scende a 16.
  - id: colpo-senzarmi
    nome: Colpo senz'armi
    caratteristica: for
    competente: true
    danno: { dado: null, fisso: 1 }
    tipoDanno: contundenti
    note: In alternativa puoi afferrare o spingere, CD 13.
risorse:
  - { id: incanalare, nome: Incanalare Divinità, max: 2, recupero: breve }
  - { id: ira-tempesta, nome: Ira della Tempesta, max: 3, recupero: lungo }
  - { id: tuono-tempesta, nome: Tuono della Tempesta, max: 2, recupero: lungo }
slot:
  - { livello: 1, max: 4 }
  - { livello: 2, max: 2 }
trucchetti: [guida, fiamma-sacra, taumaturgia]
preparatiIniziali: [benedizione, comando, cura-ferite, parola-guaritrice, aiuto, blocca-persone]
dominio: [nube-di-nebbia, onda-tonante, folata-di-vento, frantumare]
limitePreparati: 6
monete: { mo: 16, ma: 8, mr: 0 }
equipaggiamento:
  - { id: cotta-di-maglia, nome: Cotta di maglia, quantita: 1, consumabile: false }
  - { id: scudo, nome: Scudo, quantita: 1, consumabile: false }
  - { id: maglio, nome: Maglio da guerra, quantita: 1, consumabile: false }
  - {
      id: simbolo-sacro,
      nome: 'Simbolo sacro: disco di pietra lavica',
      quantita: 1,
      consumabile: false,
      note: 'Focus da incantatore, indossato sul petto.',
    }
  - { id: strumenti-tessitore, nome: Strumenti da tessitore, quantita: 1, consumabile: false }
  - { id: acqua-santa, nome: Fiala di acqua santa, quantita: 1, consumabile: true }
  - { id: razioni, nome: Razioni (giorni), quantita: 7, consumabile: true }
  - { id: lampada, nome: Lampada, quantita: 1, consumabile: false }
  - { id: acciarino, nome: Acciarino, quantita: 1, consumabile: false }
  - { id: coperta, nome: Coperta, quantita: 1, consumabile: false }
  - { id: sacco-a-pelo, nome: Sacco a pelo, quantita: 1, consumabile: false }
  - { id: veste, nome: Veste, quantita: 1, consumabile: false }
  - { id: vestiti-viaggio, nome: Vestiti da viaggio, quantita: 1, consumabile: false }
  - { id: borraccia, nome: Borraccia, quantita: 1, consumabile: false }
  - { id: corda, nome: Corda da 50 ft, quantita: 1, consumabile: false }
  - { id: zaino, nome: Zaino, quantita: 1, consumabile: false }
lingue: [Comune, Gigante, Lingua dei Segni Comune]
strumenti:
  - { nome: Strumenti da tessitore, caratteristica: des, competente: true }
capacita:
  - titolo: 'Ordine Divino: Protettore'
    paragrafi:
      - Kaelen è addestrato nelle armature pesanti e negli scudi ed è competente nelle armi marziali.
      - Le competenze simili del Dominio della Tempesta non si sommano e non forniscono altri bonus.
  - titolo: 'Incanalare Divinità: Scintilla Divina'
    paragrafi:
      - Azione Magica, creatura visibile entro 30 ft. Puoi guarirla di 1d8 + 3 PF.
      - In alternativa la creatura effettua un TS Costituzione, subendo 1d8 + 3 danni radianti o necrotici al fallimento e metà al successo. Non consuma slot.
  - titolo: 'Incanalare Divinità: Scacciare Non Morti'
    paragrafi:
      - Azione Magica. I non morti scelti entro 30 ft effettuano un TS Saggezza.
      - Chi fallisce è Spaventato e Incapacitato per 1 minuto e cerca di allontanarsi. L'effetto termina se subisce danni o se Kaelen diventa Incapacitato o muore.
  - titolo: 'Incanalare Divinità: Ira Distruttiva'
    paragrafi:
      - Quando dovresti tirare danni da fulmine o tuono, spendi un uso per usare il risultato massimo dei dadi. Non richiede un'azione.
      - L'impiego più efficace al 3° livello è Frantumare, 24 danni a chi fallisce il TS e 12 a chi riesce.
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
    innesco: Una creatura che vedi entro 5 ft ti colpisce con un attacco.
    effetto: TS Destrezza, 2d8 fulmine o tuono, metà se riesce. Tre usi per Riposo Lungo.
  - nome: Tuono della Tempesta
    innesco: Subisci danni da una creatura entro 60 ft.
    effetto: Quella creatura subisce 1d8 danni da tuono, senza TS. Due usi per Riposo Lungo.
  - nome: Attacco di Opportunità
    innesco: Un nemico visibile lascia volontariamente la tua portata.
    effetto: Un attacco di maglio.
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
