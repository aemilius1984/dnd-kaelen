import { datiIniziali, assicuraInizializzato, stato } from '@/lib/storage';

/** Sola lettura: al tavolo devi *vedere* quanto ti resta senza aprire nulla,
 *  ma spendere e recuperare si fa nel pannello azioni. Due punti di modifica
 *  per lo stesso numero erano il motivo per cui la Scheda si era gonfiata. */
export default function Risorse() {
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;

  const caselle = (usate: number, max: number) =>
    Array.from({ length: max }, (_, i) => i < max - usate);

  return (
    <div class="striscia-risorse">
      {pg.slot.map((slot) => (
        <div class="risorsa" key={`slot-${slot.livello}`}>
          <span>{slot.livello}° liv.</span>
          <span
            class="caselle"
            aria-label={`${slot.max - (s.slotSpesi[slot.livello] ?? 0)} di ${slot.max} slot di ${slot.livello}° livello`}
          >
            {caselle(s.slotSpesi[slot.livello] ?? 0, slot.max).map((piena, i) => (
              <i key={i} class={piena ? 'casella piena' : 'casella'} />
            ))}
          </span>
        </div>
      ))}
      {pg.risorse.map((r) => (
        <div class="risorsa" key={r.id}>
          <span>{r.nome}</span>
          <span
            class="caselle"
            aria-label={`${r.max - (s.risorseUsate[r.id] ?? 0)} di ${r.max} usi`}
          >
            {caselle(s.risorseUsate[r.id] ?? 0, r.max).map((piena, i) => (
              <i key={i} class={piena ? 'casella piena' : 'casella'} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
