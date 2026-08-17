import { datiIniziali, assicuraInizializzato, stato } from '@/lib/storage';
import { caselle } from '@/lib/caselle';

/** Le sole file di slot. Era metà di `Risorse.tsx`: l'altra metà — i contatori
 *  delle risorse — è andata dentro le card delle capacità, dove il numero sta
 *  accanto alla cosa che lo consuma invece che in un elenco a parte.
 *
 *  Sola lettura: al tavolo devi *vedere* quanto ti resta senza aprire nulla, ma
 *  spendere e recuperare si fa nel pannello azioni o lanciando. Due punti di
 *  modifica per lo stesso numero erano il motivo per cui la Scheda si era
 *  gonfiata. */
export default function SlotIncantesimi() {
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;

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
    </div>
  );
}
