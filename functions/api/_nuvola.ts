/** Le query e le risposte comuni ai due endpoint delle sessioni.
 *
 *  Sta qui e non dentro gli handler perché `sessioni.ts` e `sessioni/[id].ts`
 *  parlano alla stessa tabella: due copie della stessa `SELECT` divergono alla
 *  prima colonna aggiunta. Il prefisso `_` tiene il file fuori dalle rotte —
 *  Pages non pubblica i file che cominciano così. */

/** Venti salvataggi, poi si pota. Un archivio che cresce per sempre è un
 *  archivio che nessuno rilegge, e dall'elenco si può comunque eliminare a
 *  mano. */
export const LIMITE_SESSIONI = 20;

/** I campi del riepilogo: tutto tranne lo stato. */
const CAMPI = 'id, creato_il, etichetta, nota, schema_v, sheet_v';

export interface CorpoSalvataggio {
  etichetta: string | null;
  stato: { schemaVersion: number; sheetVersion: string; note?: string };
}

/** La risposta d'errore, sempre della stessa forma: il client deve poterla
 *  mostrare senza indovinare dove sta il messaggio. */
export function errore(stato: number, messaggio: string): Response {
  return Response.json({ errore: messaggio }, { status: stato });
}

/** Nessun binding: non è un incidente, è il caso normale su un clone senza
 *  Cloudflare o con `npm run dev`. Il resto della scheda continua a funzionare
 *  come sempre — la nuvola è un comando, non una sincronizzazione. */
export function senzaNuvola(): Response {
  return errore(503, 'La nuvola non è configurata su questo deploy.');
}

/** Legge e convalida il corpo di un salvataggio, o `null` se non è buono.
 *  Convalida qui e non nell'handler perché «cosa è un salvataggio valido» è
 *  una regola sola, e vale anche se domani salva qualcun altro. */
export async function leggiCorpo(request: Request): Promise<CorpoSalvataggio | null> {
  let grezzo: unknown;
  try {
    grezzo = await request.json();
  } catch {
    return null;
  }
  if (typeof grezzo !== 'object' || grezzo === null) return null;

  const { etichetta, stato } = grezzo as Record<string, unknown>;
  if (typeof stato !== 'object' || stato === null) return null;
  const s = stato as Record<string, unknown>;
  if (typeof s.schemaVersion !== 'number' || typeof s.sheetVersion !== 'string') return null;
  if (etichetta !== undefined && etichetta !== null && typeof etichetta !== 'string') return null;

  return {
    etichetta: typeof etichetta === 'string' && etichetta.trim() ? etichetta.trim() : null,
    stato: stato as CorpoSalvataggio['stato'],
  };
}

export async function elenca(db: D1Database): Promise<unknown[]> {
  const esito = await db
    .prepare(`SELECT ${CAMPI} FROM sessioni ORDER BY creato_il DESC, id DESC`)
    .all();
  return esito.results;
}

export async function una(db: D1Database, id: number): Promise<unknown | null> {
  return db.prepare(`SELECT ${CAMPI}, stato FROM sessioni WHERE id = ?`).bind(id).first();
}

export async function inserisci(
  db: D1Database,
  corpo: CorpoSalvataggio,
  limite: number,
): Promise<number | null> {
  const esito = await db
    .prepare(
      'INSERT INTO sessioni (creato_il, etichetta, nota, schema_v, sheet_v, stato) ' +
        'VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(
      new Date().toISOString(),
      corpo.etichetta,
      typeof corpo.stato.note === 'string' ? corpo.stato.note : null,
      corpo.stato.schemaVersion,
      corpo.stato.sheetVersion,
      JSON.stringify(corpo.stato),
    )
    .run();

  // Si buttano le più vecchie, non le più recenti: la sessione di tre
  // settimane fa, non quella di stasera. `id` è il secondo criterio perché due
  // salvataggi possono cadere nello stesso istante ISO, e senza di lui
  // l'ordine fra i due sarebbe quello che capita.
  await db
    .prepare(
      'DELETE FROM sessioni WHERE id NOT IN ' +
        '(SELECT id FROM sessioni ORDER BY creato_il DESC, id DESC LIMIT ?)',
    )
    .bind(limite)
    .run();

  return (esito.meta?.last_row_id as number | undefined) ?? null;
}

export async function elimina(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM sessioni WHERE id = ?').bind(id).run();
}
