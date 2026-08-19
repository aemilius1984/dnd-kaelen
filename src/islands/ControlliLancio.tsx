import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { recuperaSlot, spendiSlot } from '@/lib/sheet-state';
import { cartaSpenta, livelliLanciabili } from '@/lib/lancio';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

type Bersaglio = {
  nodo: HTMLElement;
  slug: string;
  nome: string;
  livello: number;
  rituale: boolean;
};

/** Quanto dura la finestra in cui si può disfare un lancio. Un numero solo:
 *  il timer che *decide* sta qui, e la barra che lo racconta lo riceve come
 *  proprietà personalizzata invece di dichiararlo una seconda volta in CSS —
 *  due numeri scritti a mano si sarebbero scollati al primo ripensamento, e
 *  il difetto sarebbe stato una barra che finisce prima o dopo il diritto di
 *  annullare. */
const DURATA_ANNULLA = 5000;

/** Cosa è appena stato speso. Il nome serve perché la modale si chiude e la
 *  striscia resta l'unica cosa in vista: senza, direbbe «Slot di 1° speso» a
 *  chi ha appena lanciato uno fra sei incantesimi di 1°. */
type Speso = { livello: number; nome: string };

export default function ControlliLancio() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const [bersagli, setBersagli] = useState<Bersaglio[]>([]);
  const [annullabile, setAnnullabile] = useState<Speso | null>(null);
  // Conta i lanci, e serve solo da chiave: un secondo lancio dentro la
  // finestra rimonta la striscia, così la barra riparte da piena invece di
  // continuare la corsa del lancio precedente.
  const [lanci, setLanci] = useState(0);

  // I contenitori sono markup statico generato in build: li troviamo una
  // volta sola e ci disegniamo dentro, così le regole degli incantesimi
  // restano fuori dal JavaScript.
  useEffect(() => {
    const trovati = [...document.querySelectorAll<HTMLElement>('[data-lancio]')].map((nodo) => ({
      nodo,
      slug: nodo.dataset.lancio ?? '',
      nome: nodo.dataset.nome ?? '',
      livello: Number(nodo.dataset.livello ?? '0'),
      rituale: nodo.dataset.rituale !== undefined,
    }));
    setBersagli(trovati);
  }, []);

  // Mostra solo gli incantesimi davvero preparati fra quelli del pool, che
  // sono tutti presenti in HTML. Gli altri blocchi (trucchetti, dominio) non
  // hanno data-slug e restano sempre visibili.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-slug]').forEach((el) => {
      el.hidden = !s.preparati.includes(el.dataset.slug ?? '');
    });
  }, [s.preparati]);

  // Spegne la card quando non resta uno slot con cui lanciarla. Stessa forma
  // della commutazione di `hidden` qui sopra: il markup è statico, l'isola gli
  // cambia un attributo addosso. La regola di *quando* spegnere è già
  // `livelliLanciabili`, e non viene riscritta qui.
  //
  // Spenta, non nascosta: tempo di lancio, gittata e TS restano leggibili
  // perché sono i numeri che si guardano per decidere se conviene un Riposo
  // Breve. `aria-disabled` e non `disabled` perché il contenitore non è un
  // controllo — è una card che smette di offrire i propri bottoni.
  useEffect(() => {
    for (const b of bersagli) {
      // La carta non è più un antenato del contenitore di lancio: quello sta
      // dentro la modale, che è fuori dalla carta. Ci si arriva per slug.
      const carta = document.querySelector<HTMLElement>(`[data-carta="${b.slug}"]`);
      if (!carta) continue;
      const spenta = cartaSpenta(s, pg, b.livello, b.rituale);
      carta.classList.toggle('spenta', spenta);
      if (spenta) carta.setAttribute('aria-disabled', 'true');
      else carta.removeAttribute('aria-disabled');
    }
  }, [bersagli, s.slotSpesi, pg]);

  // La dipendenza è `lanci`, non `annullabile`: due lanci di seguito dello
  // stesso livello e dello stesso incantesimo danno un oggetto uguale, e senza
  // il contatore il timer del primo continuerebbe a scorrere sotto il secondo.
  useEffect(() => {
    if (annullabile === null) return;
    const t = setTimeout(() => setAnnullabile(null), DURATA_ANNULLA);
    return () => clearTimeout(t);
  }, [lanci]);

  function lancia(b: Bersaglio, livello: number) {
    // Lo slug viaggia con la spesa: la casella consumata deve poter mostrare
    // il sigillo di *questo* incantesimo, non un pallino qualunque.
    muta((x) => spendiSlot(x, pg, livello, b.slug));
    // Lanciato, la modale ha finito il suo lavoro: si torna al foglio, dove la
    // barra degli slot mostra la casella appena consumata. Restando aperta
    // copriva la striscia di annullamento — è a tutto schermo e sta nel top
    // layer, quindi nessuno `z-index` l'avrebbe scavalcata — e il lancio non
    // dava alcun segno di essere avvenuto.
    b.nodo.closest('dialog')?.close();
    // Un secondo lancio entro la finestra sostituisce quello annullabile: si
    // può annullare solo l'ultima azione, non un intero storico di lanci.
    setAnnullabile({ livello, nome: b.nome });
    setLanci((n) => n + 1);
  }

  function annulla() {
    if (annullabile === null) return;
    muta((x) => recuperaSlot(x, annullabile.livello));
    setAnnullabile(null);
  }

  return (
    <>
      {bersagli.map((b) => {
        const livelli = livelliLanciabili(s, pg, b.livello);
        if (b.livello === 0) return null;
        return createPortal(
          <>
            {livelli.length === 0 ? (
              <span class="tenue">Nessuno slot disponibile.</span>
            ) : (
              livelli.map((l) => (
                <button key={l} type="button" onClick={() => lancia(b, l)}>
                  Lancia {l}°
                </button>
              ))
            )}
            {/* Il rituale non spende niente, quindi non c'è un bottone da
                premere: non esiste stato da cambiare finché materiali e
                Concentrazione non sono tracciati. Quel che serve al tavolo,
                e che mancava, è sapere che l'opzione c'è — soprattutto a
                slot finiti, dove prima la carta si spegneva. */}
            {b.rituale && (
              <span class="via-rituale tenue">Oppure come rituale: senza slot, +10 minuti.</span>
            )}
          </>,
          b.nodo,
        );
      })}

      {annullabile !== null && (
        <>
          {/* Il velo esiste solo per far risaltare la striscia: scurisce il
              foglio, la barra del menu e il pulsante ⚡, che altrimenti le
              rubano l'occhio. Non intercetta i tocchi — `pointer-events: none`
              — perché dura cinque secondi e bloccare la scheda per cinque
              secondi dopo *ogni* lancio sarebbe peggio del problema che
              risolve. Sembra modale, non lo è: al massimo tocchi quel che
              volevi toccare. */}
          <div class="velo-annulla" aria-hidden="true" />
          <div
            key={lanci}
            class="striscia-annulla"
            role="status"
            style={{ '--durata-annulla': `${DURATA_ANNULLA}ms` }}
          >
            <span class="detto">
              <strong>{annullabile.nome}</strong>
              <span class="costo">Slot di {annullabile.livello}° speso</span>
            </span>
            <button type="button" onClick={annulla}>
              Annulla
            </button>
            {/* La barra non è decorazione: è il tempo che resta per disfare. Si
                svuota, e quando è vuota la striscia sparisce e lo slot è
                speso. */}
            <span class="tempo" aria-hidden="true">
              <i />
            </span>
          </div>
        </>
      )}
    </>
  );
}
