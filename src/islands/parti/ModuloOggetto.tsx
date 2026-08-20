import { useState } from 'preact/hooks';
import { caratteristicheModificabili, vociFinali, type Modifica } from '@/lib/modifiche';
import type { OggettoAggiunto } from '@/lib/oggetti';

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
}: {
  onSalva: (dati: Omit<OggettoAggiunto, 'id'>) => void;
  onChiudi: () => void;
}) {
  const [magico, setMagico] = useState(false);

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
    onChiudi();
  }

  return (
    <form class="modulo-oggetto" onSubmit={salva}>
      <label>
        Nome
        <input type="text" name="nome" required autocomplete="off" />
      </label>
      <label>
        Quantità
        <input type="number" name="quantita" min="0" value="1" />
      </label>
      <label class="riga">
        <input type="checkbox" name="consumabile" />
        Si consuma usandolo
      </label>
      <label>
        Nota
        <input type="text" name="nota" placeholder="dal forziere dei Vaerak" autocomplete="off" />
      </label>

      <details class="numeri" onToggle={(e) => setMagico(e.currentTarget.open)}>
        <summary>È un oggetto magico?</summary>
        <div class="riga">
          <select name="bersaglio" aria-label="Cosa modifica">
            <option value="">niente</option>
            {caratteristicheModificabili.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()} diventa
              </option>
            ))}
            {vociFinali.map((v) => (
              <option key={v} value={v}>
                {v} ±
              </option>
            ))}
          </select>
          <input type="number" name="valore" aria-label="Di quanto" value="0" />
        </div>
        {/* Il vincolo detto dove si sbaglia. `pg.armatura` porta già cotta di
            maglia e scudo: uno scudo +1 dichiarato come «CA 2» conterebbe due
            volte, e il totale sarebbe plausibile. */}
        {magico && (
          <p class="tenue avvertenza">
            Solo il di più: uno scudo +1 è «ca +1», non «ca +2». Quel che porti già è contato.
          </p>
        )}
      </details>

      <div class="comandi">
        <button type="button" onClick={onChiudi}>
          Annulla
        </button>
        <button type="submit">Aggiungi</button>
      </div>
    </form>
  );
}
