import type { Personaggio } from './schema';

export const SCHEMA_VERSION = 1;

export interface StatoSessione {
  schemaVersion: number;
  sheetVersion: string;
  pf: number;
  pfTemporanei: number;
  dadiVitaSpesi: number;
  tsMorte: { successi: number; fallimenti: number };
  slotSpesi: Record<number, number>;
  risorseUsate: Record<string, number>;
  preparati: string[];
  monete: { mo: number; ma: number; mr: number };
  oggetti: Record<string, number>;
  note: string;
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
    tsMorte: { successi: 0, fallimenti: 0 },
    slotSpesi: Object.fromEntries(pg.slot.map((s) => [s.livello, 0])),
    risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, 0])),
    preparati: [...pg.preparatiIniziali],
    monete: { ...pg.monete },
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    note: '',
    aggiornatoIl: adesso(),
  };
}

function aggiorna(s: StatoSessione, patch: Partial<StatoSessione>): StatoSessione {
  return { ...s, ...patch, aggiornatoIl: adesso() };
}

export function carica(
  raw: string | null,
  pg: Personaggio,
  sheetVersion: string,
): { stato: StatoSessione; azzerato: boolean } {
  if (!raw) return { stato: statoIniziale(pg, sheetVersion), azzerato: false };
  try {
    const salvato = JSON.parse(raw) as StatoSessione;
    const compatibile =
      salvato?.schemaVersion === SCHEMA_VERSION && salvato?.sheetVersion === sheetVersion;
    if (!compatibile) return { stato: statoIniziale(pg, sheetVersion), azzerato: true };
    return { stato: salvato, azzerato: false };
  } catch {
    return { stato: statoIniziale(pg, sheetVersion), azzerato: true };
  }
}

export function impostaPfTemporanei(s: StatoSessione, n: number): StatoSessione {
  return aggiorna(s, { pfTemporanei: Math.max(0, n) });
}

export function applicaDanno(s: StatoSessione, n: number): StatoSessione {
  // `n` viene anche da un campo libero nel pannello azioni: un valore
  // negativo non è "cura mascherata da danno", è un input da scartare.
  const danno = Math.max(0, n);
  const assorbito = Math.min(s.pfTemporanei, danno);
  return aggiorna(s, {
    pfTemporanei: s.pfTemporanei - assorbito,
    pf: Math.max(0, s.pf - (danno - assorbito)),
  });
}

export function applicaCura(s: StatoSessione, pg: Personaggio, n: number): StatoSessione {
  // Stessa guardia di applicaDanno: un input negativo non deve poter
  // sottrarre PF da qui.
  const pf = Math.min(pg.pfMax, s.pf + Math.max(0, n));
  const tsMorte = pf > 0 ? { successi: 0, fallimenti: 0 } : s.tsMorte;
  return aggiorna(s, { pf, tsMorte });
}

export function segnaTsMorte(s: StatoSessione, esito: 'successo' | 'fallimento'): StatoSessione {
  const tsMorte = { ...s.tsMorte };
  if (esito === 'successo') tsMorte.successi = Math.min(3, tsMorte.successi + 1);
  else tsMorte.fallimenti = Math.min(3, tsMorte.fallimenti + 1);
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
  if (s.dadiVitaSpesi >= pg.numeroDadiVita) return s;
  return aggiorna(s, {
    dadiVitaSpesi: s.dadiVitaSpesi + 1,
    pf: Math.min(pg.pfMax, s.pf + Math.max(1, pf)),
  });
}

export function puoSpendereSlot(s: StatoSessione, pg: Personaggio, livello: number): boolean {
  const max = pg.slot.find((x) => x.livello === livello)?.max ?? 0;
  return (s.slotSpesi[livello] ?? 0) < max;
}

export function spendiSlot(s: StatoSessione, pg: Personaggio, livello: number): StatoSessione {
  if (!puoSpendereSlot(s, pg, livello)) return s;
  return aggiorna(s, {
    slotSpesi: { ...s.slotSpesi, [livello]: (s.slotSpesi[livello] ?? 0) + 1 },
  });
}

export function recuperaSlot(s: StatoSessione, livello: number): StatoSessione {
  return aggiorna(s, {
    slotSpesi: { ...s.slotSpesi, [livello]: Math.max(0, (s.slotSpesi[livello] ?? 0) - 1) },
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
    slotSpesi: Object.fromEntries(pg.slot.map((x) => [x.livello, 0])),
    risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, 0])),
  });
}
