import { useRef, useState } from 'preact/hooks';
import {
  applicaCura,
  applicaDanno,
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
  const [tirato, setTirato] = useState(0);

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

      <dialog class="azioni" ref={finestra}>
        <div class="testa">
          <strong>Azioni</strong>
          <button type="button" onClick={() => finestra.current?.close()}>
            Chiudi
          </button>
        </div>

        <h4>In combattimento</h4>
        <div class="riga">
          <button type="button" onClick={() => muta((x) => applicaDanno(x, 1))}>
            −1
          </button>
          <button type="button" onClick={() => muta((x) => applicaDanno(x, 5))}>
            −5
          </button>
          <input
            type="number"
            min="0"
            aria-label="Quantità"
            value={quanto}
            onInput={(e) => setQuanto(Number(e.currentTarget.value))}
          />
          <button type="button" onClick={() => muta((x) => applicaDanno(x, quanto))}>
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
            value={s.pfTemporanei}
            onInput={(e) => muta((x) => impostaPfTemporanei(x, Number(e.currentTarget.value)))}
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
              Slot {slot.livello}° — {slot.max - (s.slotSpesi[slot.livello] ?? 0)}/{slot.max}
            </span>
            <button
              type="button"
              disabled={!puoSpendereSlot(s, pg, slot.livello)}
              onClick={() => muta((x) => spendiSlot(x, pg, slot.livello))}
            >
              Usa
            </button>
            <button
              type="button"
              disabled={(s.slotSpesi[slot.livello] ?? 0) === 0}
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
              disabled={!puoUsareRisorsa(s, pg, r.id)}
              onClick={() => muta((x) => usaRisorsa(x, pg, r.id))}
            >
              Usa
            </button>
            <button
              type="button"
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
            onInput={(e) => setTirato(Number(e.currentTarget.value))}
          />
          <button
            type="button"
            disabled={dadiRimasti === 0}
            onClick={() => muta((x) => spendiDadoVitaConCura(x, pg, tirato))}
          >
            Spendi
          </button>
        </div>
        <div class="riga">
          <button type="button" onClick={() => muta((x) => riposoBreve(x, pg))}>
            Concludi riposo breve
          </button>
          <button
            type="button"
            class="pericoloso"
            onClick={() => {
              if (confirm('Riposo lungo: PF al massimo, slot e risorse ripristinati. Procedere?')) {
                muta((x) => riposoLungo(x, pg));
              }
            }}
          >
            Riposo lungo
          </button>
        </div>
        <p class="tenue">
          Dopo un riposo lungo puoi cambiare i preparati: <a href="/preparati/">vai ai preparati</a>
          .
        </p>
      </dialog>
    </>
  );
}
