import type { Personaggio } from './schema';

/** Una capacità come si guarda al tavolo: un nome, eventualmente un contatore,
 *  eventualmente un innesco. Le due cose non si escludono — Ira della Tempesta
 *  è entrambe — ed è esattamente il caso che la scheda mostrava due volte, una
 *  come riga di contatore e una come riga di reazione, senza dire che erano la
 *  stessa cosa. */
export interface Capacita {
  /** L'id della risorsa quando ce n'è una: è la chiave con cui i contatori la
   *  ritrovano nello stato di sessione. Le reazioni senza contatore non ne
   *  hanno bisogno e si identificano per nome. */
  id?: string;
  nome: string;
  nomeEn: string;
  descrizione?: string;
  max?: number;
  recupero?: 'breve' | 'lungo';
  innesco?: string;
  effetto?: string;
}

/** L'unione delle risorse e delle reazioni, fusa dove `reazione.risorsa`
 *  combacia con `risorsa.id`. Funzione pura: niente markup, niente stato.
 *
 *  L'ordine è quello delle risorse per prime — sono le voci con un contatore,
 *  cioè quelle che si guardano più spesso — poi le reazioni che restano. */
export function fondiCapacita(pg: Personaggio): Capacita[] {
  const perRisorsa = new Map(
    pg.reazioni.filter((r) => r.risorsa !== undefined).map((r) => [r.risorsa!, r]),
  );

  const conContatore: Capacita[] = pg.risorse.map((r) => {
    const reazione = perRisorsa.get(r.id);
    return {
      id: r.id,
      nome: r.nome,
      nomeEn: r.nomeEn,
      descrizione: r.descrizione,
      max: r.max,
      recupero: r.recupero,
      innesco: reazione?.innesco,
      effetto: reazione?.effetto,
    };
  });

  const senzaContatore: Capacita[] = pg.reazioni
    .filter((r) => r.risorsa === undefined)
    .map((r) => ({
      nome: r.nome,
      nomeEn: r.nomeEn,
      innesco: r.innesco,
      effetto: r.effetto,
    }));

  return [...conContatore, ...senzaContatore];
}

/** Come si recupera una risorsa, detto per intero.
 *
 *  «Riposo Breve» da solo era una mezza verità che si leggeva come una bugia:
 *  accanto a «2» sembrava promettere che entrambe le cariche di Incanalare
 *  Divinità tornassero con un riposo breve, mentre ne torna una — e tutte solo
 *  con il lungo. La meccanica era già giusta in `riposoBreve`, che ne rimette
 *  esattamente una: sbagliava l'etichetta. Vedi la tabella P1 dell'audit. */
export function testoRecupero(recupero: 'breve' | 'lungo'): string {
  if (recupero === 'lungo') return 'tutti / Riposo Lungo';
  return '+1 / Riposo Breve · tutti / Riposo Lungo';
}
