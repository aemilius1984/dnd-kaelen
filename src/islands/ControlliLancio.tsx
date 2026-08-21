import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { dichiara } from '@/lib/annulla';
import { accendiEffetto, nuovoIdEffetto, spentoDa } from '@/lib/effetti';
import type { Modifica } from '@/lib/modifiche';
import { recuperaSlot, spendiSlot } from '@/lib/sheet-state';
import { cartaSpenta, livelliLanciabili } from '@/lib/lancio';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

type Bersaglio = {
  nodo: HTMLElement;
  slug: string;
  nome: string;
  livello: number;
  rituale: boolean;
  /** Assente quando l'incantesimo non lascia niente addosso. */
  durata?: string;
  concentrazione: boolean;
  promemoria?: string;
  modifiche?: Modifica[];
};

export default function ControlliLancio() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const [bersagli, setBersagli] = useState<Bersaglio[]>([]);
  // L'ultimo lancio per cui c'è qualcosa da proporre.
  const [daAccendere, setDaAccendere] = useState<string | null>(null);

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
      durata: nodo.dataset.durata,
      concentrazione: nodo.dataset.concentrazione !== undefined,
      promemoria: nodo.dataset.promemoria,
      // Assente se l'incantesimo non lascia niente: è la sola bandiera che
      // serve, e senza di lei non si propone nulla.
      modifiche: nodo.dataset.modifiche
        ? (JSON.parse(nodo.dataset.modifiche) as Modifica[])
        : undefined,
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
    // Dichiarata, non disegnata: la striscia è una sola per pagina e la monta
    // `StrisciaAnnulla`. Un secondo lancio entro la finestra sostituisce
    // questa voce — si annulla l'ultima azione, non uno storico di lanci.
    dichiara({
      detto: b.nome,
      costo: `Slot di ${livello}° speso`,
      disfa: () => muta((x) => recuperaSlot(x, livello)),
    });
    // Proposto, mai automatico: si lancia Benedizione su un compagno e
    // l'effetto non è su Kaelen. Lanciare e accendere sono due gesti, e il
    // secondo è una scelta.
    setDaAccendere(b.modifiche === undefined ? null : b.slug);
  }

  function tieniAcceso(b: Bersaglio) {
    muta((x) =>
      accendiEffetto(x, {
        id: nuovoIdEffetto(),
        nome: b.nome,
        // Lo slug: rilanciare rinnova la durata invece di accendere un secondo
        // Scudo della Fede.
        origine: b.slug,
        durata: b.durata ?? 'finché non finisce',
        concentrazione: b.concentrazione,
        promemoria: b.promemoria,
        modifiche: b.modifiche ?? [],
        accesoIl: new Date().toISOString(),
      }),
    );
    setDaAccendere(null);
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
            {daAccendere === b.slug && b.modifiche !== undefined && (
              <button type="button" class="tieni-acceso" onClick={() => tieniAcceso(b)}>
                Tienilo acceso
                {spentoDa(s, b) && <span class="tenue"> — spegne «{spentoDa(s, b)!.nome}»</span>}
              </button>
            )}
          </>,
          b.nodo,
        );
      })}
    </>
  );
}
