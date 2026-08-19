import { useState } from 'preact/hooks';
import { assicuraInizializzato, datiIniziali, stato } from '@/lib/storage';
import FilaSlot from '@/islands/FilaSlot';

/** La barra degli slot, appiccicata in cima alla sezione degli incantesimi.
 *
 *  Chiusa è una riga sola — «4/6» — e resta una riga a qualunque
 *  livello: è la ragione per cui questa forma ha vinto sulle altre due negli
 *  sketch. A livello 20 gli slot sono ventidue su nove livelli, e né i pallini
 *  né le coppie «rimasti/totale» ci stanno in 390px.
 *
 *  Aperta si prende lo spazio che serve: una riga per livello, caselle grandi,
 *  e in ogni casella consumata il sigillo dell'incantesimo che l'ha spesa.
 *
 *  Non si spende e non si recupera da qui. Due punti di modifica per lo stesso
 *  numero sono la ragione per cui la Scheda si era gonfiata: si spende
 *  lanciando, si recupera col Riposo Lungo. */
export default function BarraSlot() {
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const [aperta, setAperta] = useState(false);

  const totale = pg.slot.reduce((a, x) => a + x.max, 0);
  const spesi = pg.slot.reduce((a, x) => a + (s.slotSpesi[x.livello] ?? []).length, 0);
  const restano = totale - spesi;

  return (
    <div class={aperta ? 'barra-slot aperta' : 'barra-slot'}>
      <button
        type="button"
        class="riassunto"
        aria-expanded={aperta}
        onClick={() => setAperta(!aperta)}
      >
        <span class="conto">
          <strong class={restano === 0 ? 'a-secco' : undefined}>{restano}</strong>/{totale}
        </span>
        <span class="comando">
          dettaglio
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <polyline points="5 9 12 16 19 9" />
          </svg>
        </span>
      </button>

      {aperta && (
        <div class="file">
          {pg.slot.map((slot) => (
            <FilaSlot
              key={slot.livello}
              livello={slot.livello}
              max={slot.max}
              spesi={s.slotSpesi[slot.livello] ?? []}
              grande
            />
          ))}
        </div>
      )}
    </div>
  );
}
