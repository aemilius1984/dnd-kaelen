import type { Personaggio } from './schema';
import type { StatoSessione } from './sheet-state';

/** Una riga dell'elenco, come arriva dall'endpoint: tutto tranne lo stato. */
export interface RigaSessione {
  id: number;
  creato_il: string;
  etichetta: string | null;
  nota: string | null;
  schema_v: number;
  sheet_v: string;
}

/** La stessa riga, con lo stato dentro: è quel che si chiede quando si
 *  riprende, una alla volta. */
export interface RigaCompleta extends RigaSessione {
  stato: string;
}

/** Cosa c'era in quella sessione, in una riga sola.
 *
 *  Serve a scegliere fra venti salvataggi che si somigliano tutti: la data
 *  dice quando, l'etichetta dice dove, e questo dice a che punto era la
 *  serata. «PF 21/27 · 4 slot · 1 Incan.» si legge in un colpo d'occhio; la
 *  stessa cosa in prosa richiederebbe di fermarsi a leggere venti volte. */
export function riepilogo(stato: StatoSessione, pg: Personaggio): string {
  const pezzi = [`PF ${stato.pf}/${pg.pfMax}`];

  const slotTotali = pg.slot.reduce((a, x) => a + x.max, 0);
  const spesi = Object.values(stato.slotSpesi ?? {}).reduce((a, x) => a + x.length, 0);
  pezzi.push(`${slotTotali - spesi} slot`);

  for (const r of pg.risorse) {
    const usate = (stato.risorseUsate?.[r.id] ?? []).length;
    if (usate === 0) continue;
    // Abbreviato al primo pezzo del nome: «Incanalare Divinità» per esteso
    // mangerebbe la riga da solo, e accanto a un numero si riconosce lo stesso.
    pezzi.push(`${r.max - usate} ${r.nome.split(' ')[0].slice(0, 6)}.`);
  }

  return pezzi.join(' · ');
}

/** Vero se quel salvataggio è stato scritto per una scheda diversa da questa.
 *
 *  La regola di `sheetVersion` non ha eccezioni: al ripristino `carica()`
 *  azzera, come già fa in locale. Questo serve a **dirlo prima** — la riga
 *  porta `sheet_v`, quindi il confronto è gratuito, e scoprire l'azzeramento
 *  dopo aver ripreso costa una serata. */
export function schedaPrecedente(riga: { sheet_v: string }, sheetVersion: string): boolean {
  return riga.sheet_v !== sheetVersion;
}

/** Le due date affiancate, prima di sovrascrivere.
 *
 *  Chi riprende il salvataggio sbagliato al tavolo perde una serata di gioco,
 *  e il rimedio deve costare un tocco prima, non un rimpianto dopo. */
export function dueDate(localeIso: string, salvataggioIso: string): string {
  return `questo dispositivo: ${quando(localeIso)} · il salvataggio: ${quando(salvataggioIso)}`;
}

/** Una data come si legge al tavolo: oggi e ieri per nome, il resto col
 *  giorno. L'ora c'è sempre, perché fra due salvataggi della stessa serata è
 *  l'unica cosa che li distingue. */
export function quando(iso: string, adesso: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  const ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const giorni = Math.floor(
    (giornoSolo(adesso).getTime() - giornoSolo(d).getTime()) / (24 * 60 * 60 * 1000),
  );
  if (giorni === 0) return `oggi ${ora}`;
  if (giorni === 1) return `ieri ${ora}`;
  return `${d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} ${ora}`;
}

const giornoSolo = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** L'esito di un comando verso la nuvola. Il fallimento è un caso normale — la
 *  rete non c'è, il binding manca, D1 tace — e va detto, non nascosto: la
 *  nuvola è un comando, non una sincronizzazione, e il locale resta la
 *  verità. */
export type Esito<T> = { ok: true; dato: T } | { ok: false; detto: string };

const SENZA_RETE = 'Nessuna risposta: sei senza rete, o la nuvola non è configurata qui.';

/** Il 404 non è un errore della nuvola: è il segno che gli endpoint non
 *  esistono affatto, e in sviluppo succede sempre — `astro dev` e `astro
 *  preview` servono i file ma non eseguono le Pages Functions. «La nuvola ha
 *  risposto 404» mandava a cercare un guasto dove non c'era. */
const SENZA_FUNZIONI =
  'Gli endpoint non ci sono. In sviluppo serve `wrangler pages dev ./dist`: ' +
  '`astro dev` e `astro preview` non eseguono le Pages Functions.';

/** Il messaggio da mostrare per una risposta andata storta. Sta qui e non
 *  nell'isola perché è la stessa frase per tutti e tre i comandi, e perché
 *  così si può provare senza montare niente. */
export async function esitoDi<T>(r: Response): Promise<Esito<T>> {
  if (r.ok) {
    if (r.status === 204) return { ok: true, dato: undefined as T };
    return { ok: true, dato: (await r.json()) as T };
  }
  if (r.status === 404) return { ok: false, detto: SENZA_FUNZIONI };
  try {
    const corpo = (await r.json()) as { errore?: string };
    if (typeof corpo.errore === 'string') return { ok: false, detto: corpo.errore };
  } catch {
    // Una risposta che non è JSON è una risposta che non viene da noi: un
    // proxy, una pagina d'errore, il captive portal di un albergo.
  }
  return { ok: false, detto: `La nuvola ha risposto ${r.status}.` };
}

/** Una chiamata alla nuvola che non lancia mai: senza rete `fetch` rifiuta, e
 *  un rifiuto non gestito lascerebbe il pannello a girare per sempre. */
export async function chiama<T>(url: string, init?: RequestInit): Promise<Esito<T>> {
  try {
    return await esitoDi<T>(await fetch(url, init));
  } catch {
    return { ok: false, detto: SENZA_RETE };
  }
}
