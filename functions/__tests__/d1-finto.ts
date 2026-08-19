/** Un `D1Database` finto, in memoria, che capisce le poche query di questi
 *  endpoint e niente di più.
 *
 *  Non è un SQLite: è un elenco di righe e quattro forme di query riconosciute
 *  a naso. Basta perché quel che si vuole provare è il comportamento degli
 *  endpoint — potatura, ordine, codici di stato — non il motore di Cloudflare.
 *  Il gate resta offline: un gate che ha bisogno della rete è un gate che
 *  prima o poi si salta, e la prova vera contro D1 si fa a mano sul deploy di
 *  preview. */
export interface Riga {
  id: number;
  creato_il: string;
  etichetta: string | null;
  nota: string | null;
  schema_v: number;
  sheet_v: string;
  stato: string;
}

/** Data decrescente, e a parità l'id: due salvataggi possono cadere nello
 *  stesso istante ISO, e senza il secondo criterio l'ordine sarebbe quello che
 *  capita — come lo sarebbe in D1 senza `ORDER BY … , id DESC`. */
const perData = (a: Riga, b: Riga) => b.creato_il.localeCompare(a.creato_il) || b.id - a.id;

export class D1Finto {
  righe: Riga[] = [];
  /** Le query viste, in ordine: serve a provare che l'elenco non si porta
   *  dietro lo stato intero di venti sessioni. */
  viste: string[] = [];
  private prossimoId = 1;
  /** Quando è acceso, ogni query esplode: è la D1 muta del piano. */
  muto = false;

  prepare = (sql: string) => {
    this.viste.push(sql);
    let legati: unknown[] = [];
    const stmt = {
      bind: (...args: unknown[]) => {
        legati = args;
        return stmt;
      },
      run: async () => this.esegui(sql, legati),
      all: async () => this.esegui(sql, legati),
      first: async () => (await this.esegui(sql, legati)).results[0] ?? null,
    };
    return stmt;
  };

  private esegui = async (sql: string, legati: unknown[]) => {
    if (this.muto) throw new Error('D1 non risponde');
    const q = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (q.startsWith('INSERT')) {
      const [creato_il, etichetta, nota, schema_v, sheet_v, stato] = legati as [
        string,
        string | null,
        string | null,
        number,
        string,
        string,
      ];
      this.righe.push({
        id: this.prossimoId++,
        creato_il,
        etichetta,
        nota,
        schema_v,
        sheet_v,
        stato,
      });
      return { results: [], success: true, meta: { last_row_id: this.prossimoId - 1 } };
    }

    if (q.startsWith('DELETE')) {
      const prima = this.righe.length;
      if (q.includes('WHERE ID = ?')) {
        this.righe = this.righe.filter((r) => r.id !== Number(legati[0]));
      } else {
        // La potatura: tiene le prime N in ordine di data decrescente.
        const tieni = Number(legati[0]);
        const ordinate = [...this.righe].sort(perData);
        const superstiti = new Set(ordinate.slice(0, tieni).map((r) => r.id));
        this.righe = this.righe.filter((r) => superstiti.has(r.id));
      }
      return { results: [], success: true, meta: { changes: prima - this.righe.length } };
    }

    const ordinate = [...this.righe].sort(perData);
    if (q.includes('WHERE ID = ?')) {
      const trovata = ordinate.find((r) => r.id === Number(legati[0]));
      return { results: trovata ? [trovata] : [], success: true, meta: {} };
    }
    // L'elenco non chiede `stato`: sono venti sessioni intere per disegnare
    // venti righe di riepilogo.
    return {
      results: ordinate.map(({ stato, ...resto }) =>
        q.includes(' STATO') ? { stato, ...resto } : resto,
      ),
      success: true,
      meta: {},
    };
  };
}
