import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { recuperaSlot, spendiSlot } from '@/lib/sheet-state';
import { livelliLanciabili } from '@/lib/lancio';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

type Bersaglio = { nodo: HTMLElement; slug: string; livello: number };

export default function ControlliLancio() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const [bersagli, setBersagli] = useState<Bersaglio[]>([]);
  const [annullabile, setAnnullabile] = useState<number | null>(null);

  // I contenitori sono markup statico generato in build: li troviamo una
  // volta sola e ci disegniamo dentro, così le regole degli incantesimi
  // restano fuori dal JavaScript.
  useEffect(() => {
    const trovati = [...document.querySelectorAll<HTMLElement>('[data-lancio]')].map((nodo) => ({
      nodo,
      slug: nodo.dataset.lancio ?? '',
      livello: Number(nodo.dataset.livello ?? '0'),
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
      const carta = b.nodo.closest<HTMLElement>('.incantesimo');
      if (!carta) continue;
      const spenta = livelliLanciabili(s, pg, b.livello).length === 0;
      carta.classList.toggle('spenta', spenta);
      if (spenta) carta.setAttribute('aria-disabled', 'true');
      else carta.removeAttribute('aria-disabled');
    }
  }, [bersagli, s.slotSpesi, pg]);

  useEffect(() => {
    if (annullabile === null) return;
    const t = setTimeout(() => setAnnullabile(null), 5000);
    return () => clearTimeout(t);
  }, [annullabile]);

  function lancia(livello: number, slug: string) {
    // Lo slug viaggia con la spesa: la casella consumata deve poter mostrare
    // il sigillo di *questo* incantesimo, non un pallino qualunque.
    muta((x) => spendiSlot(x, pg, livello, slug));
    // Un secondo lancio entro la finestra sostituisce quello annullabile: si
    // può annullare solo l'ultima azione, non un intero storico di lanci.
    setAnnullabile(livello);
  }

  function annulla() {
    if (annullabile === null) return;
    muta((x) => recuperaSlot(x, annullabile));
    setAnnullabile(null);
  }

  return (
    <>
      {bersagli.map((b) => {
        const livelli = livelliLanciabili(s, pg, b.livello);
        if (b.livello === 0) return null;
        return createPortal(
          livelli.length === 0 ? (
            <span class="tenue">Nessuno slot disponibile.</span>
          ) : (
            <>
              {livelli.map((l) => (
                <button key={l} type="button" onClick={() => lancia(l, b.slug)}>
                  Lancia {l}°
                </button>
              ))}
            </>
          ),
          b.nodo,
        );
      })}

      {annullabile !== null && (
        <div class="annulla" role="status">
          <span>Slot di {annullabile}° speso.</span>
          <button type="button" onClick={annulla}>
            Annulla
          </button>
        </div>
      )}
    </>
  );
}
