import { useRef, useState } from 'preact/hooks';
import {
  applicaCura,
  applicaDanno,
  impostaIspirazione,
  impostaPfTemporanei,
  puoSpendereSlot,
  puoUsareRisorsa,
  recuperaRisorsa,
  recuperaSlot,
  riposoBreve,
  riposoLungo,
  segnaTsMorte,
  spendiDadoVitaConCura,
  spendiSlot,
  SLOT_MANUALE,
  usaRisorsa,
} from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

export default function PannelloAzioni() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const finestra = useRef<HTMLDialogElement>(null);
  const [quanto, setQuanto] = useState(0);
  // Testo e non numero: il campo ha `min="1"` e deve poter restare vuoto
  // mentre lo si ridigita, senza passare per lo 0 che quel minimo rifiuta.
  // Vale 1 all'apertura, il più piccolo totale che si possa tirare.
  const [tirato, setTirato] = useState('1');
  // La bozza del campo dei PF temporanei, che è l'unico controllato su un
  // valore salvato: `null` significa "mostra quello che dice lo stato",
  // stringa vuota "l'utente lo sta cancellando, non toccare niente". Senza
  // questo, `onInput` riscriveva lo stato a ogni battuta e cancellare il
  // contenuto faceva ricomparire uno 0 sotto le dita.
  const [bozzaTemporanei, setBozzaTemporanei] = useState<string | null>(null);

  const dadiRimasti = pg.numeroDadiVita - s.dadiVitaSpesi;

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
          <button type="button" onClick={() => finestra.current?.close()}>
            Chiudi
          </button>
        </div>

        <h4>In combattimento</h4>
        <div class="riga">
          <button type="button" onClick={() => muta((x) => applicaDanno(x, pg, 1))}>
            −1
          </button>
          <button type="button" onClick={() => muta((x) => applicaDanno(x, pg, 5))}>
            −5
          </button>
          <input
            type="number"
            min="0"
            aria-label="Quantità"
            value={quanto}
            onInput={(e) => setQuanto(Number(e.currentTarget.value))}
          />
          <button type="button" onClick={() => muta((x) => applicaDanno(x, pg, quanto))}>
            Danno
          </button>
          <button type="button" onClick={() => muta((x) => applicaCura(x, pg, quanto))}>
            Cura
          </button>
        </div>

        <label class="riga">
          PF temporanei
          <input
            type="number"
            min="0"
            value={bozzaTemporanei ?? String(s.pfTemporanei)}
            onInput={(e) => {
              const grezzo = e.currentTarget.value;
              // Un campo vuoto non è "zero PF temporanei", è una cifra a
              // metà: lo stato non si tocca finché non arriva un numero.
              if (grezzo === '') {
                setBozzaTemporanei('');
                return;
              }
              setBozzaTemporanei(null);
              muta((x) => impostaPfTemporanei(x, Number(grezzo)));
            }}
            onBlur={() => setBozzaTemporanei(null)}
          />
        </label>

        {s.pf === 0 && (
          <div class="riga">
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

        {pg.slot.map((slot) => (
          <div class="riga" key={`slot-${slot.livello}`}>
            <span>
              Slot {slot.livello}° — {slot.max - (s.slotSpesi[slot.livello] ?? []).length}/
              {slot.max}
            </span>
            <button
              type="button"
              aria-label={`Usa uno slot di ${slot.livello}° livello`}
              disabled={!puoSpendereSlot(s, pg, slot.livello)}
              onClick={() => muta((x) => spendiSlot(x, pg, slot.livello, SLOT_MANUALE))}
            >
              Usa
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

        {pg.risorse.map((r) => (
          <div class="riga" key={r.id}>
            <span>
              {r.nome} — {r.max - (s.risorseUsate[r.id] ?? 0)}/{r.max}
            </span>
            <button
              type="button"
              aria-label={`Usa ${r.nome}`}
              disabled={!puoUsareRisorsa(s, pg, r.id)}
              onClick={() => muta((x) => usaRisorsa(x, pg, r.id))}
            >
              Usa
            </button>
            <button
              type="button"
              aria-label={`Recupera ${r.nome}`}
              disabled={(s.risorseUsate[r.id] ?? 0) === 0}
              onClick={() => muta((x) => recuperaRisorsa(x, r.id))}
            >
              ↺
            </button>
          </div>
        ))}

        <h4>Fuori dal combattimento</h4>
        <div class="riga">
          <span>
            Dadi vita {dadiRimasti}/{pg.numeroDadiVita} ({pg.dadoVita})
          </span>
          <input
            type="number"
            min="1"
            aria-label="Totale tirato al tavolo"
            value={tirato}
            onInput={(e) => setTirato(e.currentTarget.value)}
          />
          <button
            type="button"
            disabled={dadiRimasti === 0}
            onClick={() => muta((x) => spendiDadoVitaConCura(x, pg, Number(tirato)))}
          >
            Spendi
          </button>
        </div>
        <label class="riga">
          <input
            type="checkbox"
            checked={s.ispirazione}
            onChange={(e) => muta((x) => impostaIspirazione(x, e.currentTarget.checked))}
          />
          Ispirazione Eroica <span class="tenue">Heroic Inspiration</span>
        </label>

        <div class="riga">
          <button type="button" onClick={() => muta((x) => riposoBreve(x, pg))}>
            Concludi riposo breve
          </button>
          <button
            type="button"
            class="pericoloso"
            onClick={() => {
              if (
                !confirm(
                  'Riposo lungo: PF al massimo, tutti i dadi vita recuperati, slot e risorse ' +
                    'ripristinati. Procedere?',
                )
              ) {
                return;
              }
              muta((x) => riposoLungo(x, pg));
              // Cambiare i preparati è dovuto proprio adesso: il pannello si
              // toglie di mezzo e apre l'archivio. Cerca il dialogo per id e
              // basta — non sa cosa ci sia dentro, e su /personaggio/ non c'è
              // affatto, dove l'assenza non deve buttare giù il riposo.
              finestra.current?.close();
              document.querySelector<HTMLDialogElement>('#archivio')?.showModal();
            }}
          >
            Riposo lungo
          </button>
        </div>
        <p class="tenue">
          Il riposo lungo apre l'archivio degli incantesimi. Puoi aprirlo anche da solo:{' '}
          <a href="/preparati/">vai all'archivio</a>.
        </p>
      </dialog>
    </>
  );
}
