import type { Personaggio } from './schema';

export const SCHEMA_VERSION = 3;

/** Dove sta Kaelen rispetto alla morte. È un campo suo e non una deduzione dai
 *  PF, perché a 0 PF ci sono tre situazioni diverse — si tira, si è stabili, si
 *  è morti — e i punti ferita sono zero in tutte e tre. */
export type StatoVitale = 'cosciente' | 'incosciente' | 'stabile' | 'morto';

/** Lo slot speso a mano dal pannello azioni non ha un incantesimo dietro, ma
 *  occupa comunque una casella. Il carattere `:` non può comparire in uno
 *  slug, che viene dal nome di un file in `content/spells/`: la collisione è
 *  impossibile per costruzione, non per fortuna. */
export const SLOT_MANUALE = ':manuale';

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
  risorseUsate: Record<string, number>;
  preparati: string[];
  monete: { mo: number; ma: number; mr: number };
  oggetti: Record<string, number>;
  note: string;
  /** Ispirazione Eroica: la dà il DM e la si spende, non si recupera con un
   *  riposo. Per questo nessuno dei due riposi la tocca. */
  ispirazione: boolean;
  aggiornatoIl: string;
}

const adesso = () => new Date().toISOString();

export function statoIniziale(pg: Personaggio, sheetVersion: string): StatoSessione {
  return {
    schemaVersion: SCHEMA_VERSION,
    sheetVersion,
    pf: pg.pfMax,
    pfTemporanei: 0,
    dadiVitaSpesi: 0,
    statoVitale: 'cosciente',
    tsMorte: { successi: 0, fallimenti: 0 },
    slotSpesi: Object.fromEntries(pg.slot.map((s) => [s.livello, []])),
    risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, 0])),
    preparati: [...pg.preparatiIniziali],
    monete: { ...pg.monete },
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    note: '',
    ispirazione: false,
    aggiornatoIl: adesso(),
  };
}

function aggiorna(s: StatoSessione, patch: Partial<StatoSessione>): StatoSessione {
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

  return { ...v2, schemaVersion: SCHEMA_VERSION, statoVitale, tsMorte, aggiornatoIl: adesso() };
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
      return { stato: statoIniziale(pg, sheetVersion), azzerato: true };
    }
    if (salvato.schemaVersion === SCHEMA_VERSION) return { stato: salvato, azzerato: false };
    // La forma dello stato è cambiata, i dati no: si migra ciò che è
    // inequivocabile e si azzera solo dove non lo è. Aggiungere un campo non
    // deve costare PF, slot e note a metà campagna.
    if (salvato.schemaVersion === 2) return { stato: migraDa2(salvato), azzerato: false };
    return { stato: statoIniziale(pg, sheetVersion), azzerato: true };
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

/** Un segno solo sul tabellone dei TS morte. È la primitiva: `tiroMorte` le
 *  passa sopra e traduce un d20 in uno o due segni. Il terzo non si accumula —
 *  cambia stato e azzera i contatori, che è perché ne bastano due per lato. */
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

/** Il tiro salvezza contro morte, preso come esce dal dado. Non basta sapere
 *  se ha passato: un 1 naturale vale due fallimenti e un 20 naturale rimette
 *  in piedi, e nessuno dei due si può dedurre da «successo» o «fallimento». */
export function tiroMorte(s: StatoSessione, d20: number): StatoSessione {
  if (s.statoVitale !== 'incosciente') return s;
  const tiro = Math.round(d20);
  if (tiro < 1 || tiro > 20) return s;
  if (tiro === 20) return aggiorna(s, { pf: 1, statoVitale: 'cosciente', ...AZZERA_TS });
  if (tiro === 1) return segnaTsMorte(segnaTsMorte(s, 'fallimento'), 'fallimento');
  return segnaTsMorte(s, tiro >= 10 ? 'successo' : 'fallimento');
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
  return (s.risorseUsate[id] ?? 0) < max;
}

export function usaRisorsa(s: StatoSessione, pg: Personaggio, id: string): StatoSessione {
  if (!puoUsareRisorsa(s, pg, id)) return s;
  return aggiorna(s, {
    risorseUsate: { ...s.risorseUsate, [id]: (s.risorseUsate[id] ?? 0) + 1 },
  });
}

export function recuperaRisorsa(s: StatoSessione, id: string): StatoSessione {
  return aggiorna(s, {
    risorseUsate: { ...s.risorseUsate, [id]: Math.max(0, (s.risorseUsate[id] ?? 0) - 1) },
  });
}

export function puoPreparare(s: StatoSessione, pg: Personaggio): boolean {
  return s.preparati.length < pg.limitePreparati;
}

export function togglePreparato(s: StatoSessione, pg: Personaggio, slug: string): StatoSessione {
  if (s.preparati.includes(slug)) {
    return aggiorna(s, { preparati: s.preparati.filter((x) => x !== slug) });
  }
  // Gli incantesimi di dominio sono sempre preparati e i trucchetti non si
  // "preparano": non devono mai entrare in questa lista, né occupare uno
  // slot del limite, indipendentemente da come è arrivato qui lo slug (uno
  // stato salvato in precedenza incluso).
  if (pg.dominio.includes(slug) || pg.trucchetti.includes(slug)) return s;
  if (!puoPreparare(s, pg)) return s;
  return aggiorna(s, { preparati: [...s.preparati, slug] });
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
export function riposoBreve(s: StatoSessione, pg: Personaggio): StatoSessione {
  const risorseUsate = { ...s.risorseUsate };
  for (const r of pg.risorse) {
    if (r.recupero === 'breve') risorseUsate[r.id] = Math.max(0, (risorseUsate[r.id] ?? 0) - 1);
  }
  return aggiorna(s, { risorseUsate });
}

export function riposoLungo(s: StatoSessione, pg: Personaggio): StatoSessione {
  const recuperati = Math.max(1, Math.floor(pg.numeroDadiVita / 2));
  return aggiorna(s, {
    pf: pg.pfMax,
    pfTemporanei: 0,
    tsMorte: { successi: 0, fallimenti: 0 },
    dadiVitaSpesi: Math.max(0, s.dadiVitaSpesi - recuperati),
    slotSpesi: Object.fromEntries(pg.slot.map((x) => [x.livello, []])),
    risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, 0])),
  });
}
