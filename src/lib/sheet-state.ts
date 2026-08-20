import type { Personaggio } from './schema';
import type { Effetto } from './effetti';
import type { OggettoAggiunto } from './oggetti';

export const SCHEMA_VERSION = 5;

/** Dove sta Kaelen rispetto alla morte. È un campo suo e non una deduzione dai
 *  PF, perché a 0 PF ci sono tre situazioni diverse — si tira, si è stabili, si
 *  è morti — e i punti ferita sono zero in tutte e tre. */
export type StatoVitale = 'cosciente' | 'incosciente' | 'stabile' | 'morto';

/** La spesa fatta a mano dal pannello azioni non ha un incantesimo né un uso
 *  dietro, ma occupa comunque una casella. Vale per le due code, slot e
 *  risorse: si chiamava `SLOT_MANUALE` quando la coda era una sola.
 *
 *  Il carattere `:` non può comparire in uno slug, che viene dal nome di un
 *  file in `content/spells/`: la collisione è impossibile per costruzione,
 *  non per fortuna. */
export const SPESA_MANUALE = ':manuale';

export interface StatoSessione {
  schemaVersion: number;
  sheetVersion: string;
  pf: number;
  pfTemporanei: number;
  dadiVitaSpesi: number;
  statoVitale: StatoVitale;
  /** Solo 0..2 per contatore: il terzo segno non si accumula, cambia
   *  `statoVitale` e azzera entrambi. */
  tsMorte: { successi: number; fallimenti: number };
  /** Per ogni livello, gli slug degli incantesimi che ne hanno bruciato uno
   *  slot, in ordine cronologico. Un elenco e non un conteggio perché la
   *  casella consumata porta il sigillo di ciò che l'ha spesa, e perché
   *  «Annulla» deve poter togliere *l'ultimo* lancio, non uno qualsiasi. */
  slotSpesi: Record<number, string[]>;
  /** Per ogni risorsa, chi ne ha consumato una carica, in ordine cronologico.
   *  Stessa forma e stessa ragione di `slotSpesi`: un conteggio non dice
   *  *cosa* è stato speso, e senza quello «Annulla» toglierebbe un'unità
   *  anonima invece di disfare l'ultimo gesto. Chi ha speso è lo slug di un
   *  uso della risorsa, oppure `SPESA_MANUALE`. */
  risorseUsate: Record<string, string[]>;
  preparati: string[];
  monete: { mo: number; ma: number; mr: number };
  oggetti: Record<string, number>;
  note: string;
  /** Ispirazione Eroica: la dà il DM e la si spende, non si recupera con un
   *  riposo. Per questo nessuno dei due riposi la tocca. */
  ispirazione: boolean;
  /** Gli oggetti raccolti al tavolo. L'unica cosa nello stato di cui l'autore è
   *  il giocatore, e per questo l'unica che sopravvive all'azzeramento. */
  oggettiAggiunti: OggettoAggiunto[];
  /** Quel che è acceso adesso. Si azzera a ogni riposo e a ogni cambio di dati:
   *  gli effetti durano minuti, e fra due build ne passano di più. */
  effetti: Effetto[];
  /** Gli id degli oggetti aggiunti che Kaelen porta addosso. Un elenco a parte e
   *  non una bandiera sull'oggetto: la stessa fiala può stare nello zaino di un
   *  compagno senza smettere di essere sua. */
  indossati: string[];
  /** 0..6. Nella 2024 ogni livello è −2 a ogni prova col d20 e −5 piedi di
   *  velocità, e il sesto livello è la morte. Non è un effetto e non sta in
   *  quella lista: il riposo lungo ne toglie uno, il breve non lo tocca. */
  esaurimento: number;
  aggiornatoIl: string;
}

const adesso = () => new Date().toISOString();

/** Lo stato di partenza. `precedente` è il salvataggio che si sta buttando via:
 *  quasi tutto quel che contiene il repo sa ricostruirlo, e ricostruirlo è
 *  giusto. Gli oggetti raccolti al tavolo e le note no — sparirebbero per sempre
 *  perché qualcuno ha corretto un refuso in `quantita`. */
export function statoIniziale(
  pg: Personaggio,
  sheetVersion: string,
  precedente?: StatoSessione,
): StatoSessione {
  const oggettiAggiunti = precedente?.oggettiAggiunti ?? [];
  const sopravvissuti = new Set(oggettiAggiunti.map((o) => o.id));
  return {
    schemaVersion: SCHEMA_VERSION,
    sheetVersion,
    pf: pg.pfMax,
    pfTemporanei: 0,
    dadiVitaSpesi: 0,
    statoVitale: 'cosciente',
    tsMorte: { successi: 0, fallimenti: 0 },
    slotSpesi: Object.fromEntries(pg.slot.map((s) => [s.livello, []])),
    risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, []])),
    preparati: [...pg.preparatiIniziali],
    monete: { ...pg.monete },
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    note: precedente?.note ?? '',
    ispirazione: false,
    oggettiAggiunti,
    // Gli effetti no: durano minuti, e non si riaccende da solo quel che il
    // giocatore ha lasciato acceso due build fa.
    effetti: [],
    // Un indossato senza il suo oggetto è un id appeso nel vuoto.
    indossati: (precedente?.indossati ?? []).filter((id) => sopravvissuti.has(id)),
    esaurimento: 0,
    aggiornatoIl: adesso(),
  };
}

/** L'unico modo di scrivere nello stato: ogni mutazione passa di qui, e da qui
 *  esce con l'orologio aggiornato. Esportata perché i mutatori degli effetti e
 *  degli oggetti stanno in moduli loro — questo file è già lungo — e
 *  reimplementarla lì sarebbe un secondo orologio da tenere allineato. */
export function aggiorna(s: StatoSessione, patch: Partial<StatoSessione>): StatoSessione {
  return { ...s, ...patch, aggiornatoIl: adesso() };
}

/** Dallo schema 2 al 3: l'unica novità è `statoVitale`, e a 0 PF si deduce dai
 *  contatori vecchi senza ambiguità — tre fallimenti erano la morte, tre
 *  successi la stabilità, il resto è un tiro ancora aperto. */
function migraDa2(v2: StatoSessione): StatoSessione {
  const ts = v2.tsMorte ?? { successi: 0, fallimenti: 0 };
  let statoVitale: StatoVitale = 'cosciente';
  let tsMorte = { successi: 0, fallimenti: 0 };

  if (v2.pf <= 0) {
    if (ts.fallimenti >= 3) statoVitale = 'morto';
    else if (ts.successi >= 3) statoVitale = 'stabile';
    else {
      statoVitale = 'incosciente';
      tsMorte = { successi: Math.min(2, ts.successi), fallimenti: Math.min(2, ts.fallimenti) };
    }
  }

  // Non si ferma qui: da 2 si passa da 3, e la 3 ha una forma che la 4 non
  // capisce più. Una catena e non due strade, altrimenti ogni versione nuova
  // raddoppierebbe i percorsi da tenere in piedi.
  return { ...v2, schemaVersion: 3, statoVitale, tsMorte };
}

/** Dallo schema 3 al 4: `risorseUsate` era un conteggio, adesso è la coda di
 *  chi ha speso. Chi fosse non è ricostruibile — lo stato vecchio sapeva solo
 *  «due» — e non si inventa: entrano tanti segnaposto quante erano le cariche
 *  spese, così le caselle restano piene come il giocatore le ha lasciate. */
function migraDa3(v3: StatoSessione, pg: Personaggio): StatoSessione {
  const vecchie = v3.risorseUsate as unknown as Record<string, number | string[]>;
  const risorseUsate: Record<string, string[]> = {};
  for (const r of pg.risorse) {
    const usate = vecchie?.[r.id];
    // Una risorsa aggiunta ai dati dopo l'ultimo salvataggio non compare nella
    // mappa vecchia: senza una casella sua, `Contatori` leggerebbe undefined.
    if (Array.isArray(usate)) risorseUsate[r.id] = [...usate];
    else risorseUsate[r.id] = Array.from({ length: Math.max(0, usate ?? 0) }, () => SPESA_MANUALE);
  }
  // Alla 4, non a SCHEMA_VERSION: dalla 4 si passa dalla 5, e scrivere qui la
  // costante farebbe saltare un anello ogni volta che ne nasce uno nuovo.
  return { ...v3, schemaVersion: 4, risorseUsate };
}

/** Dallo schema 4 al 5: la più facile della catena. Quattro campi che prima non
 *  esistevano, quindi vuoti — non c'è niente da indovinare e niente da
 *  azzerare. */
function migraDa4(v4: StatoSessione): StatoSessione {
  return {
    ...v4,
    schemaVersion: SCHEMA_VERSION,
    oggettiAggiunti: [],
    effetti: [],
    indossati: [],
    esaurimento: 0,
  };
}

export function carica(
  raw: string | null,
  pg: Personaggio,
  sheetVersion: string,
): { stato: StatoSessione; azzerato: boolean } {
  if (!raw) return { stato: statoIniziale(pg, sheetVersion), azzerato: false };
  try {
    const salvato = JSON.parse(raw) as StatoSessione;
    // I dati del personaggio sono cambiati: i numeri salvati non valgono più,
    // e nessuna migrazione può indovinarli.
    if (salvato?.sheetVersion !== sheetVersion) {
      return { stato: statoIniziale(pg, sheetVersion, salvato), azzerato: true };
    }
    if (salvato.schemaVersion === SCHEMA_VERSION) return { stato: salvato, azzerato: false };
    // La forma dello stato è cambiata, i dati no: si migra ciò che è
    // inequivocabile e si azzera solo dove non lo è. Aggiungere un campo non
    // deve costare PF, slot e note a metà campagna.
    let stato = salvato;
    if (stato.schemaVersion === 2) stato = migraDa2(stato);
    if (stato.schemaVersion === 3) stato = migraDa3(stato, pg);
    if (stato.schemaVersion === 4) stato = migraDa4(stato);
    if (stato.schemaVersion !== SCHEMA_VERSION) {
      return { stato: statoIniziale(pg, sheetVersion), azzerato: true };
    }
    return { stato: { ...stato, aggiornatoIl: adesso() }, azzerato: false };
  } catch {
    return { stato: statoIniziale(pg, sheetVersion), azzerato: true };
  }
}

export function impostaPfTemporanei(s: StatoSessione, n: number): StatoSessione {
  return aggiorna(s, { pfTemporanei: Math.max(0, n) });
}

export function applicaDanno(
  s: StatoSessione,
  pg: Personaggio,
  n: number,
  critico = false,
): StatoSessione {
  // `n` viene anche da un campo libero nel pannello azioni: un valore
  // negativo non è "cura mascherata da danno", è un input da scartare.
  const danno = Math.max(0, n);
  if (danno === 0 || s.statoVitale === 'morto') return s;

  // Già a terra: il danno non toglie punti ferita che non ci sono, segna
  // fallimenti. Un critico ne segna due, e un colpo abbastanza grosso uccide
  // comunque sul posto.
  if (s.pf === 0) {
    if (danno >= pg.pfMax) return aggiorna(s, { statoVitale: 'morto', ...AZZERA_TS });
    let out = s.statoVitale === 'stabile' ? aggiorna(s, { statoVitale: 'incosciente' }) : s;
    for (let i = 0; i < (critico ? 2 : 1); i++) out = segnaTsMorte(out, 'fallimento');
    return out;
  }

  const assorbito = Math.min(s.pfTemporanei, danno);
  const aiPf = danno - assorbito;
  const pfTemporanei = s.pfTemporanei - assorbito;
  if (aiPf < s.pf) return aggiorna(s, { pfTemporanei, pf: s.pf - aiPf });

  // Morte istantanea: conta il danno che avanza *dopo* aver azzerato i PF.
  const residuo = aiPf - s.pf;
  return aggiorna(s, {
    pfTemporanei,
    pf: 0,
    statoVitale: residuo >= pg.pfMax ? 'morto' : 'incosciente',
    ...AZZERA_TS,
  });
}

export function applicaCura(s: StatoSessione, pg: Personaggio, n: number): StatoSessione {
  // Stessa guardia di applicaDanno: un input negativo non deve poter
  // sottrarre PF da qui.
  const pf = Math.min(pg.pfMax, s.pf + Math.max(0, n));
  if (pf === 0) return aggiorna(s, { pf });
  // Vale anche da `morto`. È una deviazione consapevole dal manuale: questo è
  // un tabellone da tavolo, e un «morto» segnato per sbaglio senza altra via
  // d'uscita che azzerare la sessione farebbe più danni della regola.
  return aggiorna(s, { pf, statoVitale: 'cosciente', ...AZZERA_TS });
}

const AZZERA_TS = { tsMorte: { successi: 0, fallimenti: 0 } } as const;

/** Un segno sul tabellone dei TS morte. La modale chiede l'esito, non il
 *  numero uscito: il confronto con 10 lo fa già chi tira il dado. Il terzo
 *  segno non si accumula — cambia stato e azzera i contatori, che è perché ne
 *  bastano due per lato. */
export function segnaTsMorte(s: StatoSessione, esito: 'successo' | 'fallimento'): StatoSessione {
  if (s.statoVitale !== 'incosciente') return s;
  const tsMorte = { ...s.tsMorte };

  if (esito === 'successo') {
    tsMorte.successi += 1;
    if (tsMorte.successi >= 3) return aggiorna(s, { statoVitale: 'stabile', ...AZZERA_TS });
  } else {
    tsMorte.fallimenti += 1;
    if (tsMorte.fallimenti >= 3) return aggiorna(s, { statoVitale: 'morto', ...AZZERA_TS });
  }

  return aggiorna(s, { tsMorte });
}

/** Il manuale (PHB 2024, p. 372) fa spendere i dadi vita *durante* il riposo
 *  breve: qui le due cose sono un gesto solo. Il totale arriva dal tavolo —
 *  il sito non tira dadi — e vale almeno 1 PF, come dice la regola. */
export function spendiDadoVitaConCura(
  s: StatoSessione,
  pg: Personaggio,
  pf: number,
): StatoSessione {
  // Il Riposo Breve richiede almeno 1 PF: da terra non ci si cura da soli.
  if (s.pf === 0 || s.dadiVitaSpesi >= pg.numeroDadiVita) return s;
  return aggiorna(s, {
    dadiVitaSpesi: s.dadiVitaSpesi + 1,
    pf: Math.min(pg.pfMax, s.pf + Math.max(1, pf)),
  });
}

export function puoSpendereSlot(s: StatoSessione, pg: Personaggio, livello: number): boolean {
  const max = pg.slot.find((x) => x.livello === livello)?.max ?? 0;
  return (s.slotSpesi[livello] ?? []).length < max;
}

export function spendiSlot(
  s: StatoSessione,
  pg: Personaggio,
  livello: number,
  slug: string,
): StatoSessione {
  if (!puoSpendereSlot(s, pg, livello)) return s;
  return aggiorna(s, {
    slotSpesi: { ...s.slotSpesi, [livello]: [...(s.slotSpesi[livello] ?? []), slug] },
  });
}

export function recuperaSlot(s: StatoSessione, livello: number): StatoSessione {
  return aggiorna(s, {
    // L'ultimo, non uno qualsiasi: è ciò che «Annulla» promette al giocatore
    // che ha appena lanciato.
    slotSpesi: { ...s.slotSpesi, [livello]: (s.slotSpesi[livello] ?? []).slice(0, -1) },
  });
}

export function puoUsareRisorsa(s: StatoSessione, pg: Personaggio, id: string): boolean {
  const max = pg.risorse.find((r) => r.id === id)?.max ?? 0;
  return (s.risorseUsate[id] ?? []).length < max;
}

/** `da` è lo slug dell'uso che ha bruciato la carica — Scintilla Divina, Ira
 *  Distruttiva — oppure il segnaposto quando a spendere è il pannello azioni,
 *  che consuma senza sapere da cosa. */
export function usaRisorsa(
  s: StatoSessione,
  pg: Personaggio,
  id: string,
  da: string = SPESA_MANUALE,
): StatoSessione {
  if (!puoUsareRisorsa(s, pg, id)) return s;
  return aggiorna(s, {
    risorseUsate: { ...s.risorseUsate, [id]: [...(s.risorseUsate[id] ?? []), da] },
  });
}

export function recuperaRisorsa(s: StatoSessione, id: string): StatoSessione {
  return aggiorna(s, {
    // L'ultimo, non uno qualsiasi: come per gli slot, è ciò che «Annulla»
    // promette a chi ha appena speso.
    risorseUsate: { ...s.risorseUsate, [id]: (s.risorseUsate[id] ?? []).slice(0, -1) },
  });
}

/** L'ultima guardia prima di localStorage: nello stato canonico entra solo una
 *  lista completa e legittima. Non esiste più un «commuta un preparato» che
 *  scriva diretto — cambiare i sei è un atto che si conferma, e fuori dalla
 *  sessione di preparazione non si fa affatto. Vedi `src/lib/preparazione.ts`. */
export function impostaPreparati(
  s: StatoSessione,
  pg: Personaggio,
  lista: string[],
): StatoSessione {
  if (lista.length !== pg.limitePreparati) return s;
  if (new Set(lista).size !== lista.length) return s;
  // Dominio e trucchetti sono sempre preparati e stanno fuori dal conto: se
  // entrassero qui ruberebbero un posto a un incantesimo da scegliere.
  for (const slug of lista) {
    if (pg.dominio.includes(slug) || pg.trucchetti.includes(slug)) return s;
  }
  return aggiorna(s, { preparati: [...lista] });
}

export function impostaMonete(s: StatoSessione, monete: StatoSessione['monete']): StatoSessione {
  return aggiorna(s, { monete: { ...monete } });
}

export function impostaOggetto(s: StatoSessione, id: string, quantita: number): StatoSessione {
  return aggiorna(s, { oggetti: { ...s.oggetti, [id]: Math.max(0, quantita) } });
}

export function impostaNote(s: StatoSessione, testo: string): StatoSessione {
  return aggiorna(s, { note: testo });
}

export function impostaIspirazione(s: StatoSessione, valore: boolean): StatoSessione {
  return aggiorna(s, { ispirazione: valore });
}

/** Riposo Breve: recupera un uso delle risorse a recupero breve. Non tocca PF,
 *  slot né dadi vita: la spesa dei dadi vita resta una scelta manuale. */
/** Precondizione di entrambi i riposi: almeno 1 PF. A zero si è incoscienti, e
 *  da incoscienti non si riposa — ci si stabilizza. */
function puoRiposare(s: StatoSessione): boolean {
  return s.pf > 0;
}

export function riposoBreve(s: StatoSessione, pg: Personaggio): StatoSessione {
  if (!puoRiposare(s)) return s;
  const risorseUsate = { ...s.risorseUsate };
  for (const r of pg.risorse) {
    // Una carica sola, la più recente: la regola del Riposo Breve è quella, e
    // toglierne di più farebbe di un riposo corto un riposo lungo.
    if (r.recupero === 'breve') risorseUsate[r.id] = (risorseUsate[r.id] ?? []).slice(0, -1);
  }
  return aggiorna(s, { risorseUsate });
}

export function riposoLungo(s: StatoSessione, pg: Personaggio): StatoSessione {
  if (!puoRiposare(s)) return s;
  // Tutti i dadi vita, qualunque fosse il numero speso. Qui c'era
  // `Math.floor(numeroDadiVita / 2)`, che è la regola con cui si *recuperano i
  // livelli* di dado vita in altre edizioni: applicata al Chierico 2024
  // restituiva un dado su tre e lasciava Kaelen più fragile del dovuto a ogni
  // giornata di gioco. Vedi la tabella P0 dell'audit regolamentare.
  return aggiorna(s, {
    pf: pg.pfMax,
    pfTemporanei: 0,
    statoVitale: 'cosciente',
    tsMorte: { successi: 0, fallimenti: 0 },
    dadiVitaSpesi: 0,
    slotSpesi: Object.fromEntries(pg.slot.map((x) => [x.livello, []])),
    risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, []])),
  });
}
