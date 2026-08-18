import { useRef, useState } from 'preact/hooks';
import Rotella from '@/islands/Rotella';
import { MASSIMO, MINIMO } from '@/lib/rotella';
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
const NOME_STATO: Record<StatoSessione['statoVitale'], string> = {
  cosciente: 'cosciente',
  incosciente: 'incosciente · tira i TS',
  stabile: 'stabile · non tira più',
  morto: 'morto',
};

export default function Vitalita() {
  // `client:only="preact"`: nessun pre-render lato server.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const finestra = useRef<HTMLDialogElement>(null);

  const [quantoGrezzo, setQuanto] = useState(1);
  const [annuncio, setAnnuncio] = useState('');
  // Cambia a ogni apertura, e serve solo a rimontare la rotella. Finché la
  // modale è chiusa la pista sta fuori dal layout, e lì la posizione scritta
  // non attacca: rimontandola, la scrittura avviene su una pista disposta
  // invece che aspettare un evento di scorrimento che potrebbe non arrivare.
  const [aperture, setAperture] = useState(0);

  /** Applica un gesto e ne racconta l'esito. L'annuncio non è un extra: chi
   *  non vede il numero cambiare non ha altro modo di sapere che è successo.
   *  La frase arriva già fatta da chi chiama, perché i gesti non hanno tutti
   *  la stessa forma — l'Ispirazione non ha una quantità, e un modello unico
   *  le faceva recitare «Ispirazione presa 0». */
  const applica = (fn: (x: StatoSessione) => StatoSessione, detto: string): void => {
    muta(fn);
    setAnnuncio(`${detto} ${stato.value.pf} punti ferita.`);
  };

  const inPericolo = s.pf === 0;
  const aTerra = s.statoVitale === 'incosciente';
  // La stessa rotella serve due scopi: la quantità di PF, e il d20 del tiro
  // salvezza quando Kaelen è a terra. Cambiano gli estremi, non il gesto.
  const minimo = aTerra ? 1 : MINIMO;
  const massimo = aTerra ? 20 : MASSIMO;
  // Passando da un intervallo all'altro il numero scelto può restarne fuori:
  // uno zero portato in un d20 non evidenzia nessuna cifra e mette
  // `aria-valuenow` fuori dai limiti che la rotella dichiara.
  const quanto = Math.min(massimo, Math.max(minimo, quantoGrezzo));
  const percentuale = pg.pfMax > 0 ? Math.min(100, Math.round((s.pf / pg.pfMax) * 100)) : 0;

  return (
    <>
      <button
        type="button"
        class="vitalita-scheda"
        aria-label="Punti ferita, apri la vitalità"
        onClick={() => {
          finestra.current?.showModal();
          setAperture((n) => n + 1);
        }}
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

        {/* Il quadrante. La modale è a tutto schermo e copre la scheda in
            pagina: senza questo blocco si applica un danno e il numero che è
            cambiato non è visibile da nessuna parte. */}
        <div class="stato">
          {/* Tre dei quattro stati vitali hanno zero punti ferita: senza
              questa riga «stabile» e «morto» sono indistinguibili da «sta
              tirando i tiri salvezza». */}
          <span class={`stato-vitale ${s.statoVitale}`}>{NOME_STATO[s.statoVitale]}</span>
          <span class="numero">
            <span class={inPericolo ? 'pf pericolo' : 'pf'}>{s.pf}</span>
            <span class="su">/ {pg.pfMax}</span>
            <span class="vitalita-temp" hidden={s.pfTemporanei === 0}>
              +{s.pfTemporanei} temp
            </span>
          </span>
          <span class="metro">
            <span class="riempimento" style={{ width: `${percentuale}%` }}></span>
          </span>
          <span class="tacche" aria-hidden="true"></span>
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
                applica(
                  (x) => spendiDadoVitaConCura(x, pg, quanto),
                  `Dado vita speso, cura ${quanto}.`,
                )
              }
            >
              Spendi {quanto}
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
                  s.ispirazione ? 'Ispirazione spesa.' : 'Ispirazione presa.',
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
                onClick={() =>
                  applica((x) => tiroMorte(x, quanto), `Tiro contro morte: ${quanto}.`)
                }
              >
                Tira {quanto}
              </button>
            </div>
          )}
        </div>

        {/* La quantità a sinistra, cosa farne a destra. Il campo da digitare
            non c'è più: la rotella porta le sue frecce, e il verso da
            tastiera lo dà già lei come `spinbutton`. Via anche l'etichetta
            che spiegava l'ordine — due colonne affiancate lo dicono da sole,
            e quella riga sbilanciava la colonna di sinistra. */}
        <div class="zona-pollice">
          <Rotella
            key={aperture}
            valore={quanto}
            onCambia={setQuanto}
            minimo={minimo}
            massimo={massimo}
          />

          <div class="verbi">
            <button
              type="button"
              class="verbo-danno"
              onClick={() => applica((x) => applicaDanno(x, pg, quanto), `Danno di ${quanto}.`)}
            >
              <span class="nome">Danno</span>
              <span class="effetto">toglie {quanto} PF</span>
            </button>
            <button
              type="button"
              class="verbo-cura"
              onClick={() => applica((x) => applicaCura(x, pg, quanto), `Cura di ${quanto}.`)}
            >
              <span class="nome">Cura</span>
              <span class="effetto">rimette {quanto} PF</span>
            </button>
            <button
              type="button"
              class="verbo-temp"
              onClick={() =>
                applica((x) => impostaPfTemporanei(x, quanto), `Temporanei a ${quanto}.`)
              }
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
