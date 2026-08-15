import {
  puoSpendereSlot,
  puoUsareRisorsa,
  recuperaRisorsa,
  recuperaSlot,
  riposoBreve,
  riposoLungo,
  spendiSlot,
  usaRisorsa,
} from '@/lib/sheet-state';
import { assicuraInizializzato, azzeraTutto, datiIniziali, muta, stato } from '@/lib/storage';

function Caselle({
  usate,
  max,
  puoUsare,
  onUsa,
  onRecupera,
  etichetta,
}: {
  usate: number;
  max: number;
  puoUsare: boolean;
  onUsa: () => void;
  onRecupera: () => void;
  etichetta: string;
}) {
  const caselle = Array.from({ length: max }, (_, i) => i < max - usate);
  return (
    <div class="risorsa">
      <span>{etichetta}</span>
      <span class="caselle" aria-label={`${max - usate} di ${max} disponibili`}>
        {caselle.map((piena, i) => (
          <i key={i} class={piena ? 'casella piena' : 'casella'} />
        ))}
      </span>
      <button type="button" onClick={onUsa} disabled={!puoUsare} aria-label={`Usa ${etichetta}`}>
        Usa
      </button>
      <button
        type="button"
        onClick={onRecupera}
        disabled={usate <= 0}
        aria-label={`Recupera ${etichetta}`}
      >
        ↺
      </button>
    </div>
  );
}

export default function Risorse() {
  // `client:only="preact"`: nessun pre-render lato server, quindi nessuna
  // guardia sul DOM da scrivere qui — vedi il rapporto del Task 8.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;

  return (
    <div>
      {pg.slot.map((slot) => (
        <Caselle
          key={`slot-${slot.livello}`}
          etichetta={`Slot di ${slot.livello}° livello`}
          usate={s.slotSpesi[slot.livello] ?? 0}
          max={slot.max}
          puoUsare={puoSpendereSlot(s, pg, slot.livello)}
          onUsa={() => muta((x) => spendiSlot(x, pg, slot.livello))}
          onRecupera={() => muta((x) => recuperaSlot(x, slot.livello))}
        />
      ))}

      {pg.risorse.map((r) => (
        <Caselle
          key={r.id}
          etichetta={r.nome}
          usate={s.risorseUsate[r.id] ?? 0}
          max={r.max}
          puoUsare={puoUsareRisorsa(s, pg, r.id)}
          onUsa={() => muta((x) => usaRisorsa(x, pg, r.id))}
          onRecupera={() => muta((x) => recuperaRisorsa(x, r.id))}
        />
      ))}

      <div class="riposi">
        <button type="button" onClick={() => muta((x) => riposoBreve(x, pg))}>
          Riposo Breve
        </button>
        <button type="button" onClick={() => muta((x) => riposoLungo(x, pg))}>
          Riposo Lungo
        </button>
        <button
          type="button"
          class="pericoloso"
          onClick={() => {
            if (confirm('Azzerare tutta la sessione, note e monete comprese?')) azzeraTutto();
          }}
        >
          Azzera
        </button>
      </div>
    </div>
  );
}
