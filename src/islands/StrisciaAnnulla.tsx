import { useEffect } from 'preact/hooks';
import { DURATA_ANNULLA, annullabile, disfaUltima, scarta } from '@/lib/annulla';

/** La finestra per disfare l'ultima azione, disegnata una volta per pagina.
 *
 *  Stava dentro `ControlliLancio`, che è l'isola della modale degli
 *  incantesimi: finché a spendere erano solo gli slot bastava, ma le capacità
 *  si consumano dalle proprie card, fuori da quella modale. Due strisce che
 *  non si conoscono sarebbero comparse insieme, sovrapposte, ognuna col suo
 *  timer. Chi spende adesso *dichiara* l'azione e non la disegna. */
export default function StrisciaAnnulla() {
  const azione = annullabile.value;
  const seriale = azione?.seriale;

  // La dipendenza è il seriale, non l'oggetto: due azioni identiche di fila
  // danno un oggetto uguale, e senza il numero il timer della prima
  // continuerebbe a scorrere sotto la seconda.
  useEffect(() => {
    if (seriale === undefined) return;
    const t = setTimeout(() => scarta(seriale), DURATA_ANNULLA);
    return () => clearTimeout(t);
  }, [seriale]);

  if (azione === null) return null;

  return (
    <>
      {/* Il velo esiste solo per far risaltare la striscia: scurisce il
          foglio, la barra del menu e il pulsante ⚡, che altrimenti le rubano
          l'occhio. Non intercetta i tocchi — `pointer-events: none` — perché
          dura cinque secondi e bloccare la scheda per cinque secondi dopo
          *ogni* spesa sarebbe peggio del problema che risolve. Sembra modale,
          non lo è: al massimo tocchi quel che volevi toccare. */}
      <div class="velo-annulla" aria-hidden="true" />
      <div
        key={azione.seriale}
        class="striscia-annulla"
        role="status"
        style={{ '--durata-annulla': `${DURATA_ANNULLA}ms` }}
      >
        <span class="detto">
          <strong>{azione.detto}</strong>
          <span class="costo">{azione.costo}</span>
        </span>
        <button type="button" onClick={disfaUltima}>
          Annulla
        </button>
        {/* La barra non è decorazione: è il tempo che resta per disfare. Si
            svuota, e quando è vuota la striscia sparisce e la spesa è fatta. */}
        <span class="tempo" aria-hidden="true">
          <i />
        </span>
      </div>
    </>
  );
}
