import { datiIniziali, assicuraInizializzato, stato } from '@/lib/storage';
import { sigilloProprio } from '@/lib/sigilli';

/** Le sole file di slot. Era metà di `Risorse.tsx`: l'altra metà — i contatori
 *  delle risorse — è andata dentro le card delle capacità, dove il numero sta
 *  accanto alla cosa che lo consuma invece che in un elenco a parte.
 *
 *  Ogni casella consumata porta il sigillo dell'incantesimo che l'ha spesa,
 *  così guardando la fila si capisce *dove* è finita la magia della serata e
 *  non solo quanta ne resta.
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
      {pg.slot.map((slot) => {
        const spesi = s.slotSpesi[slot.livello] ?? [];
        // Le caselle si consumano da destra: la prima spesa resta dov'è
        // quando ne arriva un'altra. Se si rimescolassero, guardare la fila
        // non direbbe più niente.
        const slugDi = (i: number) =>
          i >= slot.max - spesi.length ? spesi[slot.max - 1 - i] : null;

        return (
          <div class="risorsa" key={`slot-${slot.livello}`}>
            <span>{slot.livello}° liv.</span>
            <span
              class="caselle"
              aria-label={`${slot.max - spesi.length} di ${slot.max} slot di ${slot.livello}° livello`}
            >
              {Array.from({ length: slot.max }, (_, i) => {
                const slug = slugDi(i);
                if (slug === null) return <i key={i} class="casella piena" />;

                // `simbolo()` ripiegherebbe sull'icona del tag per i venti
                // incantesimi senza sigillo proprio, e direbbe una cosa falsa:
                // «un incantesimo di cura» invece di «questo incantesimo». Chi
                // non ha un sigillo prende il segno neutro, come lo slot speso
                // a mano dal pannello.
                const sigillo = sigilloProprio(slug);
                if (sigillo === null) return <i key={i} class="casella manuale" />;

                return (
                  <i key={i} class="casella usata">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <use href={`#${sigillo}`} />
                    </svg>
                  </i>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
