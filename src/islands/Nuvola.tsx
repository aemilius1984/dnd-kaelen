import { useState } from 'preact/hooks';
import {
  chiama,
  dueDate,
  quando,
  riepilogo,
  schedaPrecedente,
  type RigaCompleta,
  type RigaSessione,
} from '@/lib/nuvola';
import { impostaNote } from '@/lib/sheet-state';
import { datiIniziali, muta, ripristina, stato } from '@/lib/storage';

type Fase = 'ferma' | 'lavoro';

/** Il pannello nuvola, dentro il ⚡.
 *
 *  Un comando, non una sincronizzazione: si salva quando si vuole e si
 *  riprende quando serve. Se la rete non c'è, o il binding manca, o D1 tace,
 *  il comando dice che non è riuscito e **non tocca niente in locale**. Il
 *  locale resta la verità. */
export default function Nuvola() {
  const { pg, sheetVersion } = datiIniziali();
  const s = stato.value;
  const [etichetta, setEtichetta] = useState('');
  const [fase, setFase] = useState<Fase>('ferma');
  const [detto, setDetto] = useState<string | null>(null);
  const [elenco, setElenco] = useState<RigaSessione[] | null>(null);
  // La riga che si sta per riprendere: fra il tocco e la sovrascrittura c'è
  // questo passaggio, dove si vedono le due date e si può salvare prima.
  const [inRipresa, setInRipresa] = useState<RigaSessione | null>(null);

  async function salva(): Promise<boolean> {
    setFase('lavoro');
    // La nota non si digita qui: è `stato.note`, la stessa di `/note/`, e la
    // riga ne conserva una copia. Un secondo posto dove scrivere la stessa
    // frase è un secondo posto dove dimenticarsela.
    const esito = await chiama<{ id: number }>('/api/sessioni', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ etichetta: etichetta.trim() || null, stato: s }),
    });
    setFase('ferma');
    setDetto(esito.ok ? 'Salvata in nuvola.' : esito.detto);
    if (esito.ok) {
      setEtichetta('');
      setElenco(null);
    }
    return esito.ok;
  }

  async function apriElenco() {
    setFase('lavoro');
    const esito = await chiama<RigaSessione[]>('/api/sessioni');
    setFase('ferma');
    if (!esito.ok) {
      setDetto(esito.detto);
      return;
    }
    setDetto(null);
    setElenco(esito.dato);
  }

  async function riprendi(riga: RigaSessione) {
    setFase('lavoro');
    const esito = await chiama<RigaCompleta>(`/api/sessioni/${riga.id}`);
    setFase('ferma');
    if (!esito.ok) {
      setDetto(esito.detto);
      return;
    }
    // Passa da `carica()`: se la scheda è cambiata azzera, come farebbe
    // all'apertura della pagina, e l'avviso è quello di sempre.
    const azzerato = ripristina(esito.dato.stato);
    setInRipresa(null);
    setElenco(null);
    setDetto(
      azzerato
        ? 'Ripresa, ma la scheda è cambiata: la sessione è ripartita da zero.'
        : 'Sessione ripresa.',
    );
  }

  async function elimina(riga: RigaSessione) {
    setFase('lavoro');
    const esito = await chiama(`/api/sessioni/${riga.id}`, { method: 'DELETE' });
    setFase('ferma');
    if (!esito.ok) {
      setDetto(esito.detto);
      return;
    }
    setElenco((e) => (e ?? []).filter((x) => x.id !== riga.id));
  }

  return (
    <section class="nuvola">
      <h4>Sessione in nuvola</h4>

      <label class="riga">
        <span class="tenue">Etichetta</span>
        <input
          type="text"
          maxLength={60}
          placeholder="il molo di Thuunvar"
          value={etichetta}
          onInput={(e) => setEtichetta(e.currentTarget.value)}
        />
      </label>

      {/* La nota è quella di `/note/`, non una seconda: qui si scrive nello
          stesso campo, così il diario resta uno solo. */}
      <label class="riga nota">
        <span class="tenue">Nota di sessione</span>
        <textarea
          rows={2}
          value={s.note}
          onInput={(e) => muta((x) => impostaNote(x, e.currentTarget.value))}
        />
      </label>

      <div class="riga">
        <button type="button" disabled={fase === 'lavoro'} onClick={() => void salva()}>
          Salva adesso
        </button>
        <button type="button" disabled={fase === 'lavoro'} onClick={() => void apriElenco()}>
          Riprendi…
        </button>
      </div>

      {detto !== null && <p class="esito">{detto}</p>}

      {elenco !== null &&
        (elenco.length === 0 ? (
          <p class="tenue">Nessuna sessione salvata.</p>
        ) : (
          <ul class="salvataggi">
            {elenco.map((riga) => (
              <li key={riga.id}>
                <div class="chi">
                  <strong>{riga.etichetta ?? 'senza etichetta'}</strong>
                  <span class="tenue">{quando(riga.creato_il)}</span>
                  {riga.nota && <span class="nota-riga tenue">{riga.nota}</span>}
                  {/* Il confronto è gratuito: la riga porta già `sheet_v`. */}
                  {schedaPrecedente(riga, sheetVersion) && (
                    <span class="precedente">scheda precedente</span>
                  )}
                </div>
                <button type="button" onClick={() => setInRipresa(riga)}>
                  Riprendi
                </button>
                <button type="button" aria-label="Elimina" onClick={() => void elimina(riga)}>
                  ✕
                </button>

                {inRipresa?.id === riga.id && (
                  <div class="conferma-ripresa">
                    {/* Le due date affiancate: chi riprende il salvataggio
                        sbagliato al tavolo perde una serata, e il rimedio deve
                        costare un tocco prima, non un rimpianto dopo. */}
                    <p class="date">{dueDate(s.aggiornatoIl, riga.creato_il)}</p>
                    <p class="tenue">{riepilogo(s, pg)} → quel salvataggio</p>
                    <div class="riga">
                      <button
                        type="button"
                        onClick={() => {
                          // Solo se il salvataggio è riuscito: riprendere dopo
                          // un salvataggio fallito è esattamente la serata che
                          // questo passaggio esiste per non far perdere.
                          void salva().then(async (ok) => {
                            if (ok) await riprendi(riga);
                          });
                        }}
                      >
                        Salva prima, poi riprendi
                      </button>
                      <button type="button" class="pericoloso" onClick={() => void riprendi(riga)}>
                        Riprendi e sovrascrivi
                      </button>
                      <button type="button" onClick={() => setInRipresa(null)}>
                        Annulla
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
