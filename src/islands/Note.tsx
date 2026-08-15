import { impostaNote } from '@/lib/sheet-state';
import { assicuraInizializzato, muta, stato } from '@/lib/storage';

export default function Note() {
  // `client:only="preact"`: nessun pre-render lato server, quindi nessuna
  // guardia sul DOM da scrivere qui — vedi il rapporto del Task 8.
  assicuraInizializzato();
  return (
    <textarea
      class="note"
      rows={8}
      aria-label="Note di sessione"
      placeholder="Nomi, indizi, promemoria della sessione…"
      value={stato.value.note}
      onInput={(e) => muta((x) => impostaNote(x, e.currentTarget.value))}
    />
  );
}
