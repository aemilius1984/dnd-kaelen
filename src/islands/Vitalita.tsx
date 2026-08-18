import { useRef, useState } from 'preact/hooks';
import Rotella from '@/islands/Rotella';
import { MINIMO } from '@/lib/rotella';
import type { StatoSessione } from '@/lib/sheet-state';
import {
  applicaCura,
  applicaDanno,
  impostaIspirazione,
  impostaPfTemporanei,
  spendiDadoVitaConCura,
  tiroMorte,
} from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

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

  const [quanto, setQuanto] = useState(1);
  const [annuncio, setAnnuncio] = useState('');

  /** Applica un gesto e ne racconta l'esito. L'annuncio non è un extra: chi
   *  non vede il numero cambiare non ha altro modo di sapere che è successo. */
  const applica = (
    fn: (x: StatoSessione) => StatoSessione,
    quanti: number,
    verbo: string,
  ): void => {
    muta(fn);
    setAnnuncio(`${verbo} ${quanti}. ${stato.value.pf} punti ferita.`);
  };

  const inPericolo = s.pf === 0;
  const aTerra = s.statoVitale === 'incosciente';
  // La stessa rotella serve due scopi: la quantità di PF, e il d20 del tiro
  // salvezza quando Kaelen è a terra. Cambiano gli estremi, non il gesto.
  const estremi = aTerra ? { minimo: 1, massimo: 20 } : {};
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

        <div class="righe">
          <div class="riga riga-dadi">
            <span class="kicker">dadi vita</span>
            <span class="conto">
              {pg.numeroDadiVita - s.dadiVitaSpesi}/{pg.numeroDadiVita} ({pg.dadoVita})
            </span>
            <button
              type="button"
              disabled={s.pf === 0 || s.dadiVitaSpesi >= pg.numeroDadiVita}
              onClick={() =>
                applica((x) => spendiDadoVitaConCura(x, pg, quanto), quanto, 'Dado vita')
              }
            >
              Spendi
            </button>
          </div>

          <div class="riga riga-isp">
            <span class="kicker">ispirazione eroica</span>
            <span class={s.ispirazione ? 'stella accesa' : 'stella'} aria-hidden="true">
              {s.ispirazione ? '★' : '☆'}
            </span>
            <button
              type="button"
              onClick={() =>
                applica(
                  (x) => impostaIspirazione(x, !s.ispirazione),
                  0,
                  s.ispirazione ? 'Ispirazione spesa' : 'Ispirazione presa',
                )
              }
            >
              {s.ispirazione ? 'Spendi' : 'Prendi'}
            </button>
          </div>

          {aTerra && (
            <div class="riga riga-ts">
              <span class="kicker">ts contro morte</span>
              <span class="conto">
                {s.tsMorte.successi} ✓ · {s.tsMorte.fallimenti} ✗
              </span>
              {/* Il bottone dice con che numero tirerà: la rotella qui è il
                  d20, e leggerlo sul bottone toglie ogni dubbio su cosa
                  stia per essere applicato. */}
              <button
                type="button"
                onClick={() => applica((x) => tiroMorte(x, quanto), quanto, 'Tiro contro morte')}
              >
                Tira {quanto}
              </button>
            </div>
          )}
        </div>

        <div class="zona-pollice">
          <div class="quanto">
            <span class="kicker">quanto, e poi cosa</span>
            <Rotella valore={quanto} onCambia={setQuanto} {...estremi} />
            <label class="riga-digita">
              <span class="kicker">digita</span>
              <input
                class="digita"
                type="number"
                min={MINIMO}
                inputMode="numeric"
                value={quanto}
                onInput={(e) => {
                  const grezzo = e.currentTarget.value;
                  // Un campo vuoto non è «zero»: è una cifra a metà. Finché
                  // non arriva un numero, la quantità non si tocca.
                  if (grezzo === '') return;
                  setQuanto(Math.max(MINIMO, Number(grezzo)));
                }}
              />
            </label>
          </div>

          <div class="verbi">
            <button
              type="button"
              class="verbo-danno"
              onClick={() => applica((x) => applicaDanno(x, pg, quanto), quanto, 'Danno')}
            >
              <span class="nome">Danno</span>
              <span class="effetto">toglie {quanto} PF</span>
            </button>
            <button
              type="button"
              class="verbo-cura"
              onClick={() => applica((x) => applicaCura(x, pg, quanto), quanto, 'Cura')}
            >
              <span class="nome">Cura</span>
              <span class="effetto">rimette {quanto} PF</span>
            </button>
            <button
              type="button"
              class="verbo-temp"
              onClick={() => applica((x) => impostaPfTemporanei(x, quanto), quanto, 'Temporanei')}
            >
              <span class="nome">Temporanei</span>
              <span class="effetto">imposta a {quanto}</span>
            </button>
          </div>
        </div>

        <p class="annuncio" aria-live="polite">
          {annuncio}
        </p>
      </dialog>
    </>
  );
}
