import { avvisoAzzeramento } from '@/lib/storage';

/** L'unico contenuto dinamico che ogni pagina con `DatiIniziali` deve poter
 *  mostrare: quando `sheetVersion` cambia, `assicuraInizializzato()` azzera la
 *  sessione e alza questo segnale — su /scheda/, /personaggio/, /preparati/ e
 *  /note/ allo stesso modo. Finché l'avviso viveva dentro PfTracker era
 *  visibile solo sulla Scheda, e un azzeramento incassato altrove restava
 *  muto: la prima `muta()` di quella pagina persiste lo stato fresco e non
 *  c'è più niente da dire all'utente.
 *
 *  L'isola **legge soltanto** il segnale. Non chiama
 *  `assicuraInizializzato()`: è l'isola vera della pagina a farlo, quando ha
 *  il blocco `#dati-iniziali` da leggere. Il testo è quello che aveva in
 *  PfTracker, e non è contenuto statico — esiste solo in questo stato. */
export default function AvvisoAzzeramento() {
  if (!avvisoAzzeramento.value) return null;

  return (
    <p class="avviso" role="status">
      Scheda aggiornata: risorse e punti ferita sono stati ripristinati.{' '}
      <button type="button" onClick={() => (avvisoAzzeramento.value = false)}>
        Ho capito
      </button>
    </p>
  );
}
