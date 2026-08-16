import { useLayoutEffect } from 'preact/hooks';
import { assicuraInizializzato, stato } from '@/lib/storage';

/** Non disegna nulla: aggiorna solo l'attributo `hidden` dei blocchi di
 *  incantesimi del pool renderizzati in HTML statico dalla sezione
 *  Incantesimi (uno per `data-slug`, vedi TabellaIncantesimi). Così un
 *  incantesimo scambiato dal PreparatiPicker mostra subito le sue regole
 *  complete, senza spostare contenuto in JavaScript — vedi Fix 2. */
export default function PreparatiVisibili() {
  // `client:only="preact"`: nessun pre-render lato server, quindi nessuna
  // guardia sul DOM da scrivere qui — vedi il rapporto del Task 8.
  assicuraInizializzato();
  const preparati = stato.value.preparati;

  useLayoutEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-slug]').forEach((el) => {
      el.hidden = !preparati.includes(el.dataset.slug ?? '');
    });
  });

  return null;
}
