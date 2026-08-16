import { assicuraInizializzato, datiIniziali, stato } from '@/lib/storage';

/** Sola lettura, come Risorse.tsx: al tavolo il PF dev'essere visibile
 *  sempre, ma modificarlo è compito del pannello azioni (PannelloAzioni).
 *  Prima della riscrittura questo tracker chiamava `spendiDadoVita` (senza
 *  cura) mentre il pannello chiamava `spendiDadoVitaConCura`: due controlli
 *  per lo stesso numero, già divergenti. Vedi la specifica: «il PF resta
 *  visibile sempre; è il pannello di modifica che sparisce.» */
export default function PfTracker() {
  // `client:only="preact"`: nessun pre-render lato server, quindi nessuna
  // guardia sul DOM da scrivere qui — vedi il rapporto del Task 8.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const inPericolo = s.pf === 0;
  const percentuale = pg.pfMax > 0 ? Math.min(100, Math.round((s.pf / pg.pfMax) * 100)) : 0;

  return (
    <div class="pf">
      <div class="riga">
        <span class={inPericolo ? 'numero pericolo' : 'numero'}>
          {s.pf}
          <span class="tenue">/{pg.pfMax}</span>
        </span>
      </div>

      <div
        class="barra-pf"
        role="progressbar"
        aria-valuenow={s.pf}
        aria-valuemin={0}
        aria-valuemax={pg.pfMax}
        aria-label="Punti ferita"
      >
        <div
          class={inPericolo ? 'riempimento pericolo' : 'riempimento'}
          style={{ width: `${percentuale}%` }}
        />
      </div>

      {s.pfTemporanei > 0 && <p class="riga tenue">PF temporanei: {s.pfTemporanei}</p>}

      <p class="riga tenue">
        Dadi vita {pg.numeroDadiVita - s.dadiVitaSpesi}/{pg.numeroDadiVita} ({pg.dadoVita})
      </p>

      {inPericolo && (
        <p class="riga tenue">
          TS morte {s.tsMorte.successi}✓ {s.tsMorte.fallimenti}✗
        </p>
      )}
    </div>
  );
}
