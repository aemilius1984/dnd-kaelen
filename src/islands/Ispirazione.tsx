import { assicuraInizializzato, stato } from '@/lib/storage';

/** L'indicatore nella fascia delle difese, di sola lettura come tutto quel che
 *  sta lì: si accende dal pannello azioni. Sta nella fascia e non nel pannello
 *  perché è una cosa che si guarda per decidere se ritirare un dado, e quella
 *  decisione si prende in mezzo secondo. */
export default function Ispirazione() {
  assicuraInizializzato();
  const accesa = stato.value.ispirazione;

  return (
    <div class={accesa ? 'ispirazione accesa' : 'ispirazione'}>
      <span class="tenue">ISP</span>
      <span
        class="valore"
        aria-label={accesa ? 'Ispirazione Eroica disponibile' : 'Nessuna Ispirazione Eroica'}
      >
        {accesa ? '★' : '☆'}
      </span>
    </div>
  );
}
