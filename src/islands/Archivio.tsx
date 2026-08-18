import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { annulla, apri, bozza, commuta, completa } from '@/lib/preparazione';
import { impostaPreparati } from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

type Bersaglio = { nodo: HTMLElement; slug: string };

/** Le sole spunte di preparazione, più i comandi della sessione. L'elenco dei
 *  trentanove incantesimi è markup statico reso da `ElencoArchivio.astro`:
 *  quest'isola non lo produce, ci disegna dentro per portale — stesso schema di
 *  `ControlliLancio` e `Contatori`.
 *
 *  Non sa dove si trova: gira identica dentro il `<dialog>` della Scheda e come
 *  contenuto della rotta `/preparati/`.
 *
 *  Le regole di *cosa* si può preparare stanno in `preparazione.ts` e
 *  `impostaPreparati`, non qui. Qui c'è la regola di *quando*: fuori da una
 *  sessione aperta le spunte sono in sola lettura, perché il manuale fa
 *  cambiare i sei solo alla fine di un Riposo Lungo. */
export default function Archivio() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const lista = bozza.value;
  const aperta = lista !== null;
  const [bersagli, setBersagli] = useState<Bersaglio[]>([]);

  useEffect(() => {
    setBersagli(
      [...document.querySelectorAll<HTMLElement>('[data-preparabile]')].map((nodo) => ({
        nodo,
        slug: nodo.dataset.preparabile ?? '',
      })),
    );
  }, []);

  // A sessione chiusa si mostra la verità salvata; a sessione aperta la bozza,
  // che non è ancora salvata da nessuna parte.
  const scelti = lista ?? s.preparati;

  const conferma = () => {
    if (!lista || !completa(lista, pg)) return;
    muta((x) => impostaPreparati(x, pg, lista));
    annulla();
  };

  return (
    <>
      {bersagli.map((b) => {
        const scelto = scelti.includes(b.slug);
        return createPortal(
          <label class={scelto ? 'prepara scelto' : 'prepara'}>
            <input
              type="checkbox"
              checked={scelto}
              disabled={!aperta}
              onChange={() => {
                if (lista) bozza.value = commuta(lista, pg, b.slug);
              }}
            />
            <span class="etichetta-prepara">{scelto ? 'preparato' : 'prepara'}</span>
          </label>,
          b.nodo,
        );
      })}

      {aperta ? (
        <div class="barra-preparazione" role="group" aria-label="Sessione di preparazione">
          <span class="conto">
            <strong>{lista.length}</strong>/{pg.limitePreparati}
          </span>
          <span class="dritta">
            {completa(lista, pg)
              ? 'pronti'
              : `scegline ancora ${pg.limitePreparati - lista.length}`}
          </span>
          <button type="button" class="annulla" onClick={annulla}>
            Annulla
          </button>
          {/* Disabilitato finché non sono esattamente sei: né cinque né sette
              sono stati che le regole ammettono, e non devono poter arrivare
              allo stato salvato. */}
          <button type="button" class="conferma" disabled={!completa(lista, pg)} onClick={conferma}>
            Conferma
          </button>
        </div>
      ) : (
        <p class="prep-chiusa tenue">
          I sei preparati si cambiano alla fine di un Riposo Lungo.{' '}
          {/* La via d'uscita per gli errori manuali. Si chiama così apposta:
              correggere è legittimo, ma non deve sembrare che la regola lo
              preveda. */}
          <button type="button" class="concessione" onClick={() => apri(s.preparati)}>
            Modifica concessa dal DM
          </button>
        </p>
      )}
    </>
  );
}
