import { useRef, useState } from 'preact/hooks';
import Rotella from '@/islands/Rotella';
import { MASSIMO, MINIMO } from '@/lib/rotella';
import type { StatoSessione } from '@/lib/sheet-state';
import {
  applicaCura,
  applicaDanno,
  impostaIspirazione,
  impostaPfTemporanei,
  segnaTsMorte,
  spendiDadoVitaConCura,
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
  // La rotella serve una cosa sola: la quantità di punti ferita. I tiri contro
  // morte si dicono com'è andata, e il dado resta sul tavolo dov'è già.
  const quanto = Math.min(MASSIMO, Math.max(MINIMO, quantoGrezzo));
  // I temporanei stanno *sopra* i punti ferita, non dentro: vanno in coda al
  // metro e di un altro colore. Ma se il metro restasse tarato sul massimo, a
  // punti ferita pieni — che è quando i temporanei si prendono — la coda
  // cadrebbe tutta fuori dalla barra e non si vedrebbe proprio quando serve.
  // Quindi finché ci sono, la scala li comprende. A zero il conto torna
  // esattamente quello di prima.
  const scala = pg.pfMax + s.pfTemporanei;
  const percentuale = scala > 0 ? Math.round((s.pf / scala) * 100) : 0;
  const percentualeTemp = scala > 0 ? Math.round((s.pfTemporanei / scala) * 100) : 0;

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
        {/* La croce al posto della parola «punti ferita»: il nome della cosa lo
            porta già `aria-label` sul bottone, e a occhio una croce si
            riconosce da più lontano di due parole in maiuscoletto. */}
        <span class="numero">
          <span class={inPericolo ? 'simbolo pericolo' : 'simbolo'}>
            <Croce />
          </span>
          <span class="conto">
            {/* Occupa il suo posto anche a zero: l'altezza è fissa e riservata. */}
            <span class="vitalita-temp" hidden={s.pfTemporanei === 0}>
              +{s.pfTemporanei} temp
            </span>
            <span class={inPericolo ? 'pf pericolo' : 'pf'}>{s.pf}</span>
            <span class="su">/ {pg.pfMax}</span>
          </span>
        </span>

        <span class="metro">
          <span class="riempimento" style={{ width: `${percentuale}%` }}></span>
          <span class="temporanei" style={{ width: `${percentualeTemp}%` }}></span>
        </span>
        <span class="tacche" aria-hidden="true"></span>

        <span class="piede">
          <span class="dadi">
            dadi {pg.numeroDadiVita - s.dadiVitaSpesi}/{pg.numeroDadiVita}
          </span>
          {/* La stella, non la sola parola: a modale chiusa è l'unico posto dove
              si vede se l'ispirazione c'è, e un'etichetta che cambia solo
              colore non lo dice a chi non ricorda quale colore vuol dire sì. */}
          <span class={s.ispirazione ? 'isp accesa' : 'isp'}>
            <span aria-hidden="true">{s.ispirazione ? '★' : '☆'}</span> isp
          </span>
          {/* Spinto a destra sull'ultima riga: in cima rubava il posto al
              numero, che è la sola cosa da leggere in un colpo d'occhio. */}
          <span class="apri">apri</span>
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
            <span class="temporanei" style={{ width: `${percentualeTemp}%` }}></span>
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
              {/* Il dado speso è sempre uno: metterci un numero faceva leggere
                  «spendi 15 dadi». Quanto cura lo dice la rotella qui sotto,
                  e l'annuncio lo ripete a cosa fatta. */}
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
                  s.ispirazione ? 'Ispirazione spesa.' : 'Ispirazione presa.',
                )
              }
            >
              {s.ispirazione ? 'Spendi' : 'Prendi'}
            </button>
          </div>

          {/* Com'è andata, non cos'è uscito. Il confronto con 10 lo fa già chi
              tira, e rifarlo qui voleva dire portare il dado dentro la
              rotella — che così torna a servire una cosa sola.

              I due tiri speciali restano dicibili senza un bottone loro: un 1
              naturale sono due fallimenti, e un 20 naturale è una cura di uno,
              che è il verbo qui sotto. */}
          {aTerra && (
            <div class="riga riga-ts">
              <div class="riga-testa">
                <span class="kicker">ts contro morte</span>
                <span class="conto">
                  {s.tsMorte.successi} ✓ · {s.tsMorte.fallimenti} ✗
                </span>
              </div>
              <div class="riga-esiti">
                <button
                  type="button"
                  onClick={() =>
                    applica((x) => segnaTsMorte(x, 'successo'), 'Tiro contro morte riuscito.')
                  }
                >
                  Successo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applica((x) => segnaTsMorte(x, 'fallimento'), 'Tiro contro morte fallito.')
                  }
                >
                  Fallimento
                </button>
              </div>
            </div>
          )}
        </div>

        {/* La quantità a sinistra, cosa farne a destra. Il campo da digitare
            non c'è più: la rotella porta le sue frecce, e il verso da
            tastiera lo dà già lei come `spinbutton`. Via anche l'etichetta
            che spiegava l'ordine — due colonne affiancate lo dicono da sole,
            e quella riga sbilanciava la colonna di sinistra. */}
        <div class="zona-pollice">
          <Rotella key={aperture} valore={quanto} onCambia={setQuanto} />

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

/** La croce dei punti ferita. Piena e con gli angoli smussati: sottile si
 *  perde accanto a un numero da 3rem, ed è l'unica cosa che dice di cosa parla
 *  questa scheda ora che la parola non c'è più. */
function Croce() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M9.4 2h5.2a1.4 1.4 0 0 1 1.4 1.4V8h4.6A1.4 1.4 0 0 1 22 9.4v5.2a1.4 1.4 0 0 1-1.4 1.4H16v4.6a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 20.6V16H3.4A1.4 1.4 0 0 1 2 14.6V9.4A1.4 1.4 0 0 1 3.4 8H8V3.4A1.4 1.4 0 0 1 9.4 2Z" />
    </svg>
  );
}
