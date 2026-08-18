import { useRef } from 'preact/hooks';
import { assicuraInizializzato, datiIniziali, stato } from '@/lib/storage';

/** La vitalità di Kaelen: il riepilogo che sta in pagina e la modale che apre.
 *  Un'isola sola per entrambi, così c'è un solo posto che legge i PF — prima
 *  della riscrittura il tracker e il pannello ⚡ ne avevano due, già
 *  divergenti. */
export default function Vitalita() {
  // `client:only="preact"`: nessun pre-render lato server.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const finestra = useRef<HTMLDialogElement>(null);

  const inPericolo = s.pf === 0;
  const percentuale = pg.pfMax > 0 ? Math.min(100, Math.round((s.pf / pg.pfMax) * 100)) : 0;

  return (
    <>
      <button
        type="button"
        class="vitalita-scheda"
        aria-label="Punti ferita, apri la vitalità"
        onClick={() => finestra.current?.showModal()}
      >
        <span class="testata">
          <span class="kicker">punti ferita</span>
          <span class="apri">apri</span>
        </span>

        <span class="numero">
          <span class={inPericolo ? 'pf pericolo' : 'pf'}>{s.pf}</span>
          <span class="su">/ {pg.pfMax}</span>
          {/* Occupa il suo posto anche a zero: l'altezza è fissa e riservata. */}
          <span class="vitalita-temp" hidden={s.pfTemporanei === 0}>
            +{s.pfTemporanei} temp
          </span>
        </span>

        <span class="metro">
          <span class="riempimento" style={{ width: `${percentuale}%` }}></span>
        </span>
        <span class="tacche" aria-hidden="true"></span>

        <span class="piede">
          <span class="dadi">
            dadi {pg.numeroDadiVita - s.dadiVitaSpesi}/{pg.numeroDadiVita}
          </span>
          <span class={s.ispirazione ? 'isp accesa' : 'isp'}>isp</span>
        </span>
      </button>

      <dialog class="vitalita" ref={finestra} aria-label="Vitalità">
        <div class="testa">
          <span class="kicker">Vitalità</span>
          <button type="button" aria-label="Chiudi" onClick={() => finestra.current?.close()}>
            ×
          </button>
        </div>
      </dialog>
    </>
  );
}
