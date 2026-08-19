import { useRef, useState } from 'preact/hooks';
import {
  puoSpendereSlot,
  recuperaRisorsa,
  recuperaSlot,
  riposoBreve,
  riposoLungo,
  spendiSlot,
  SPESA_MANUALE,
  usaRisorsa,
} from '@/lib/sheet-state';
import { conseguenzaRiposo } from '@/lib/riposi';
import {
  navigazione,
  PERCORSO_ARCHIVIO,
  segnalaPreparazioneDovuta,
} from '@/lib/consegna-preparazione';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

type Riposo = 'breve' | 'lungo';

/** Il pannello ⚡: i due riposi, e la via d'uscita quando qualcosa è andato
 *  storto.
 *
 *  Era il doppione di mezza scheda. Danno, cura, PF temporanei, tiri contro
 *  morte, dadi vita e ispirazione stanno nella Vitalità; slot e risorse si
 *  spendono dove sono scritti — la modale di lancio, le card delle capacità.
 *  Qui restavano le stesse cose dette una seconda volta, e due posti dove
 *  cambiare lo stesso numero sono il motivo per cui la scheda si era gonfiata.
 *
 *  Quel che resta non ha un'altra casa: i riposi, che non appartengono a
 *  nessuna sezione perché le toccano tutte, e le correzioni a mano, che sono
 *  il caso d'angolo — il DM concede una carica, si è premuto due volte, si è
 *  segnato uno slot che non andava speso. Chiuse di default: si aprono quando
 *  qualcosa è andato storto, non a ogni turno. */
export default function PannelloAzioni() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const finestra = useRef<HTMLDialogElement>(null);
  // Quale riposo sta chiedendo conferma. Dentro il pannello e non in un
  // `confirm()`: quello blocca il thread, non si può provare senza un browser
  // vero, e mostra il testo del browser invece del testo della scheda.
  const [conferma, setConferma] = useState<Riposo | null>(null);

  const dadiRimasti = pg.numeroDadiVita - s.dadiVitaSpesi;

  function chiudi() {
    setConferma(null);
    finestra.current?.close();
  }

  function compi(tipo: Riposo) {
    if (tipo === 'breve') {
      muta((x) => riposoBreve(x, pg));
      setConferma(null);
      return;
    }
    muta((x) => riposoLungo(x, pg));
    // Questo è l'unico momento in cui il manuale concede di cambiare i sei
    // preparati, e l'elenco ha una sede sola: la rotta `/preparati/`. Il
    // pannello si toglie di mezzo e ci porta.
    //
    // La sessione non si apre qui: fra le due pagine c'è una navigazione, e la
    // bozza è un signal di modulo che una navigazione azzera. Si lascia detto
    // che è dovuta, e la raccoglie l'archivio appena arriva.
    segnalaPreparazioneDovuta(sessionStorage);
    chiudi();
    navigazione.vai(PERCORSO_ARCHIVIO);
  }

  function blocco(tipo: Riposo, titolo: string, sotto: string) {
    const righe = conseguenzaRiposo(s, pg, tipo);
    const inutile = righe.length === 0;
    return (
      <section class="riposo">
        <h4>{titolo}</h4>
        <p class="tenue">{sotto}</p>
        {/* La conseguenza calcolata su *questa* sessione, non il manuale
            ripetuto: chi è a punti pieni e con tutti gli slot leggeva lo
            stesso avviso di chi è ridotto a tre PF. */}
        <p class="conseguenza">{inutile ? 'Non c’è niente da recuperare.' : righe.join(' · ')}</p>
        {conferma === tipo ? (
          <div class="riga">
            <button type="button" class="pericoloso" onClick={() => compi(tipo)}>
              Sì, riposa
            </button>
            <button type="button" onClick={() => setConferma(null)}>
              Annulla
            </button>
          </div>
        ) : (
          <button type="button" disabled={inutile} onClick={() => setConferma(tipo)}>
            Concludi {titolo.toLowerCase()}
          </button>
        )}
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        class="apri-azioni"
        aria-label="Apri le azioni di sessione"
        onClick={() => finestra.current?.showModal()}
      >
        ⚡
      </button>

      <dialog class="azioni" ref={finestra} aria-labelledby="titolo-azioni">
        <div class="testa">
          <strong id="titolo-azioni">Azioni</strong>
          <button type="button" onClick={chiudi}>
            Chiudi
          </button>
        </div>

        {blocco('breve', 'Riposo breve', 'Un’ora. Rende una carica alle risorse che tornano così.')}
        {blocco(
          'lungo',
          'Riposo lungo',
          `Otto ore. Rimette tutto, e porta all’archivio per scegliere i sei preparati. Dadi vita: ${dadiRimasti}/${pg.numeroDadiVita}.`,
        )}

        {/* Il caso d'angolo, e si vede che lo è: chiuso finché non serve. Il
            DM concede una carica, si preme due volte, si segna uno slot che
            non andava speso. Non è il modo normale di spendere — quello è
            lanciare l'incantesimo e toccare la capacità. */}
        <details class="correzioni">
          <summary>Correzioni a mano</summary>

          <h4>Slot</h4>
          {pg.slot.map((slot) => (
            <div class="riga" key={`slot-${slot.livello}`}>
              <span>
                Slot {slot.livello}° — {slot.max - (s.slotSpesi[slot.livello] ?? []).length}/
                {slot.max}
              </span>
              <button
                type="button"
                aria-label={`Segna speso uno slot di ${slot.livello}° livello`}
                disabled={!puoSpendereSlot(s, pg, slot.livello)}
                onClick={() => muta((x) => spendiSlot(x, pg, slot.livello, SPESA_MANUALE))}
              >
                −
              </button>
              <button
                type="button"
                aria-label={`Recupera uno slot di ${slot.livello}° livello`}
                disabled={(s.slotSpesi[slot.livello] ?? []).length === 0}
                onClick={() => muta((x) => recuperaSlot(x, slot.livello))}
              >
                ↺
              </button>
            </div>
          ))}

          <h4>Risorse</h4>
          {pg.risorse.map((r) => (
            <div class="riga" key={r.id}>
              <span>
                {r.nome} — {r.max - (s.risorseUsate[r.id] ?? []).length}/{r.max}
              </span>
              <button
                type="button"
                aria-label={`Segna usata una carica di ${r.nome}`}
                disabled={(s.risorseUsate[r.id] ?? []).length >= r.max}
                onClick={() => muta((x) => usaRisorsa(x, pg, r.id))}
              >
                −
              </button>
              <button
                type="button"
                aria-label={`Recupera una carica di ${r.nome}`}
                disabled={(s.risorseUsate[r.id] ?? []).length === 0}
                onClick={() => muta((x) => recuperaRisorsa(x, r.id))}
              >
                ↺
              </button>
            </div>
          ))}
        </details>
      </dialog>
    </>
  );
}
