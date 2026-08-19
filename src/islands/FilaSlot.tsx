import { romano } from '@/lib/romani';
import { sigilloProprio } from '@/lib/sigilli';

interface Props {
  livello: number;
  max: number;
  /** Gli slug degli slot spesi, in ordine cronologico. */
  spesi: string[];
  /** Le caselle grandi servono al pannello che si apre, dove c'è spazio; la
   *  fila compatta serve dove lo spazio è quello di una riga. */
  grande?: boolean;
}

/** Una fila di caselle per un livello di slot.
 *
 *  Ogni casella consumata porta il sigillo dell'incantesimo che l'ha spesa,
 *  così guardando la fila si capisce *dove* è finita la magia della serata e
 *  non solo quanta ne resta. Era la metà buona di `SlotIncantesimi`, tirata
 *  fuori perché adesso la usano in due — la barra in cima alla sezione e la
 *  striscia in fondo — e due copie della stessa aritmetica divergono. */
export default function FilaSlot({ livello, max, spesi, grande = false }: Props) {
  // Le caselle si consumano da destra: la prima spesa resta dov'è quando ne
  // arriva un'altra. Se si rimescolassero, guardare la fila non direbbe più
  // niente.
  const slugDi = (i: number) => (i >= max - spesi.length ? spesi[max - 1 - i] : null);

  return (
    <div class={grande ? 'risorsa fila-grande' : 'risorsa'} key={`slot-${livello}`}>
      {/* Romano, e nascosto al lettore di schermo: la descrizione per esteso
          — «tre di quattro slot di 1° livello» — sta già sulla fila accanto, e
          un lettore che dicesse «I» prima di quella direbbe una lettera. */}
      <span class="grado" aria-hidden="true">
        {romano(livello)}
      </span>
      <span
        class="caselle"
        aria-label={`${max - spesi.length} di ${max} slot di ${livello}° livello`}
      >
        {Array.from({ length: max }, (_, i) => {
          const slug = slugDi(i);
          if (slug === null) return <i key={i} class="casella piena" />;

          // `simbolo()` ripiegherebbe sull'icona del tag per i venti
          // incantesimi senza sigillo proprio, e direbbe una cosa falsa: «un
          // incantesimo di cura» invece di «questo incantesimo». Chi non ha un
          // sigillo prende il segno neutro, come lo slot speso a mano dal
          // pannello.
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
}
