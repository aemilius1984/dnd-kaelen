import {
  applicaCura,
  applicaDanno,
  impostaPfTemporanei,
  segnaTsMorte,
  spendiDadoVita,
} from '@/lib/sheet-state';
import { assicuraInizializzato, avvisoAzzeramento, datiIniziali, muta, stato } from '@/lib/storage';

export default function PfTracker() {
  // `client:only="preact"`: nessun pre-render lato server, quindi nessuna
  // guardia sul DOM da scrivere qui — vedi il rapporto del Task 8 per il
  // perché del cambio rispetto a `client:load` + guardia.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const inPericolo = s.pf === 0;

  return (
    <div class="pf">
      {avvisoAzzeramento.value && (
        <p class="avviso" role="status">
          Scheda aggiornata: risorse e punti ferita sono stati ripristinati.{' '}
          <button type="button" onClick={() => (avvisoAzzeramento.value = false)}>
            Ho capito
          </button>
        </p>
      )}

      <div class="riga">
        <button
          type="button"
          aria-label="Meno cinque"
          onClick={() => muta((x) => applicaDanno(x, 5))}
        >
          −5
        </button>
        <button type="button" aria-label="Meno uno" onClick={() => muta((x) => applicaDanno(x, 1))}>
          −1
        </button>
        <span class={inPericolo ? 'numero pericolo' : 'numero'}>
          {s.pf}
          <span class="tenue">/{pg.pfMax}</span>
        </span>
        <button
          type="button"
          aria-label="Più uno"
          onClick={() => muta((x) => applicaCura(x, pg, 1))}
        >
          +1
        </button>
        <button
          type="button"
          aria-label="Più cinque"
          onClick={() => muta((x) => applicaCura(x, pg, 5))}
        >
          +5
        </button>
      </div>

      <label class="temp">
        PF temporanei
        <input
          type="number"
          min="0"
          value={s.pfTemporanei}
          onInput={(e) => muta((x) => impostaPfTemporanei(x, Number(e.currentTarget.value)))}
        />
      </label>

      <div class="riga tenue">
        <span>
          Dadi vita {pg.numeroDadiVita - s.dadiVitaSpesi}/{pg.numeroDadiVita} ({pg.dadoVita})
        </span>
        <button type="button" onClick={() => muta((x) => spendiDadoVita(x, pg))}>
          Spendi
        </button>
      </div>

      {inPericolo && (
        <div class="riga tenue">
          <span>
            TS morte {s.tsMorte.successi}✓ {s.tsMorte.fallimenti}✗
          </span>
          <button type="button" onClick={() => muta((x) => segnaTsMorte(x, 'successo'))}>
            Successo
          </button>
          <button type="button" onClick={() => muta((x) => segnaTsMorte(x, 'fallimento'))}>
            Fallimento
          </button>
        </div>
      )}
    </div>
  );
}
