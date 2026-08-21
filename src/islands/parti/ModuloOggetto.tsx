import { useState } from 'preact/hooks';
import { caratteristicheModificabili, vociFinali, type Modifica } from '@/lib/modifiche';
import type { OggettoAggiunto } from '@/lib/oggetti';
import type { Caratteristica } from '@/lib/schema';

/** Il modulo «aggiungi oggetto», usato da due sedi: la scheda e la Borsa. Non è
 *  un'isola — non lo monta Astro, lo importa chi ne ha bisogno — e sta in
 *  `parti/` per questo: un componente copiato due volte è un componente che
 *  diverge.
 *
 *  Quattro campi visibili: nome, quantità, consumabile, nota. Niente `nomeEn`,
 *  perché è roba inventata al tavolo e non una voce di manuale; niente peso e
 *  niente valore, che sono le colonne che si compilano due volte e poi non si
 *  guardano più.
 *
 *  I modificatori stanno dietro una riga chiusa, stesso mestiere del
 *  `<details class="correzioni">` nel pannello ⚡: il caso d'angolo si vede che
 *  lo è, e chi aggiunge una corda non si trova davanti un pannello da
 *  artefatto. */
export default function ModuloOggetto({
  onSalva,
  onChiudi,
  caratteristiche,
}: {
  onSalva: (dati: Omit<OggettoAggiunto, 'id'>) => void;
  onChiudi: () => void;
  /** I punteggi di adesso, per dire accanto al campo quanto vale già quello che
   *  si sta per riscrivere. Facoltativo: il modulo funziona anche senza, solo
   *  in silenzio. */
  caratteristiche?: Record<Caratteristica, number>;
}) {
  const [magico, setMagico] = useState(false);
  const [bersaglio, setBersaglio] = useState('');
  const [valore, setValore] = useState(0);
  // Controllato, e non un `value="1"` lasciato lì: Preact riapplica quel
  // valore a **ogni** ridisegno, e il modulo si ridisegna a ogni interruttore
  // toccato. Chi scriveva «3» e poi accendeva «si consuma» si ritrovava «1»
  // senza che niente glielo dicesse. Vale per i due campi che nascono con un
  // numero dentro; nome e nota non ce l'hanno e restano dove sono.
  const [quantita, setQuantita] = useState('1');

  // «FOR diventa 21» è assoluto, ed è la regola del manuale per la Cintura di
  // Forza del Gigante: vince il più alto fra il punteggio dichiarato e quello
  // di base. Un valore più basso quindi non fa niente — e non farebbe niente
  // *in silenzio*, che è il modo peggiore. Il punteggio attuale sta scritto
  // accanto al campo perché la parola «diventa» in un menù a tendina, al
  // tavolo, non la legge nessuno.
  const attuale =
    caratteristiche && (caratteristicheModificabili as readonly string[]).includes(bersaglio)
      ? caratteristiche[bersaglio as Caratteristica]
      : null;
  const inutile = attuale !== null && valore !== 0 && valore <= attuale;

  function salva(e: Event) {
    e.preventDefault();
    const modulo = e.currentTarget as HTMLFormElement;
    const dati = new FormData(modulo);
    const nome = String(dati.get('nome') ?? '').trim();
    if (!nome) return;

    const modifiche: Modifica[] = [];
    const bersaglio = String(dati.get('bersaglio') ?? '');
    const valore = Number(dati.get('valore') ?? 0);
    if (bersaglio && valore) {
      modifiche.push(
        (caratteristicheModificabili as readonly string[]).includes(bersaglio)
          ? { genere: 'punteggio', bersaglio: bersaglio as 'for', valore }
          : { genere: 'voce', bersaglio: bersaglio as 'ca', valore },
      );
    }

    onSalva({
      nome,
      quantita: Math.max(0, Number(dati.get('quantita') ?? 1) || 1),
      consumabile: dati.get('consumabile') === 'on',
      nota: String(dati.get('nota') ?? '').trim() || undefined,
      modifiche,
    });
    modulo.reset();
    setMagico(false);
    setBersaglio('');
    setValore(0);
    setQuantita('1');
    onChiudi();
  }

  return (
    <form class="modulo modulo-oggetto" onSubmit={salva}>
      <label>
        Nome
        <input type="text" name="nome" required autocomplete="off" />
      </label>
      <label>
        Quantità
        <input
          type="number"
          name="quantita"
          min="0"
          value={quantita}
          onInput={(e) => setQuantita(e.currentTarget.value)}
        />
      </label>
      <label>
        Nota
        <input type="text" name="nota" placeholder="dal forziere dei Vaerak" autocomplete="off" />
      </label>

      {/* Le due domande sì/no una sotto l'altra e con la stessa forma. Erano
          una casella col testo accanto e una riga di `<summary>` che non
          sembrava premibile: due controlli diversi per la stessa domanda, nello
          stesso modulo. */}
      <label class="domanda">
        Si consuma usandolo
        <input type="checkbox" class="interruttore" name="consumabile" />
      </label>
      <label class="domanda">
        È un oggetto magico?
        <input
          type="checkbox"
          class="interruttore"
          checked={magico}
          onChange={(e) => setMagico(e.currentTarget.checked)}
        />
      </label>

      {/* Niente `<details>`: la piega era una seconda cosa da capire oltre alla
          domanda. Acceso l'interruttore, i campi ci sono; spento, non esistono
          — e `FormData` non li trova, che è anche il modo in cui un oggetto
          dichiarato magico e poi ripensato non porta con sé una modifica. */}
      {magico && (
        <>
          <div class="riga numeri">
            <select
              name="bersaglio"
              aria-label="Cosa modifica"
              onChange={(e) => setBersaglio(e.currentTarget.value)}
            >
              <option value="">niente</option>
              {caratteristicheModificabili.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()} diventa
                </option>
              ))}
              {vociFinali.map((v) => (
                <option key={v} value={v}>
                  {v.toUpperCase()} ±
                </option>
              ))}
            </select>
            <input
              type="number"
              name="valore"
              aria-label="Di quanto"
              value={valore}
              onInput={(e) => setValore(Number(e.currentTarget.value))}
            />
            {attuale !== null && <span class="tenue attuale">ora {attuale}</span>}
          </div>
          {inutile && (
            <p class="avviso-inutile">
              {bersaglio.toUpperCase()} vale già {attuale}: vince il più alto, quindi così non
              cambia niente.
            </p>
          )}
          {/* Il vincolo detto dove si sbaglia. `pg.armatura` porta già cotta di
              maglia e scudo: uno scudo +1 dichiarato come «CA 2» conterebbe due
              volte, e il totale sarebbe plausibile. */}
          <p class="tenue avvertenza">
            Solo il di più: uno scudo +1 è «ca +1», non «ca +2». Quel che porti già è contato.
          </p>
        </>
      )}

      <div class="comandi">
        <button type="button" onClick={onChiudi}>
          Annulla
        </button>
        <button type="submit">Aggiungi</button>
      </div>
    </form>
  );
}
