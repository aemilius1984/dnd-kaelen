import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { raccogliPreparazioneDovuta } from '@/lib/consegna-preparazione';
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
  // Il cappello della pagina è markup statico: qui si trova solo il posto dove
  // scrivere il conto e il comando, come per le spunte dell'elenco.
  const [cappello, setCappello] = useState<HTMLElement | null>(null);

  // Se si arriva qui subito dopo un Riposo Lungo, la sessione si apre da sola:
  // è l'unico momento in cui il manuale concede di cambiare i sei, e farla
  // aprire a mano vorrebbe dire chiedere un gesto in più proprio a chi il
  // diritto ce l'ha. Si raccoglie una volta sola, quindi ricaricare la pagina
  // non riapre una sessione già chiusa.
  useEffect(() => {
    if (raccogliPreparazioneDovuta(sessionStorage)) apri(stato.value.preparati);
  }, []);

  useEffect(() => {
    setBersagli(
      [...document.querySelectorAll<HTMLElement>('[data-preparabile]')].map((nodo) => ({
        nodo,
        slug: nodo.dataset.preparabile ?? '',
      })),
    );
    setCappello(document.querySelector<HTMLElement>('[data-preparazione]'));
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

      {cappello !== null &&
        createPortal(
          <>
            {/* Sotto e sopra dicono cose diverse: qui *quanti* ne hai, in fondo
                *cosa fare* di quelli scelti. Il conto sta in alto perché si
                legge scorrendo, e i due comandi restano in basso perché si
                premono col pollice. */}
            <span class="conto">
              <strong>{scelti.length}</strong> su {pg.limitePreparati}
              {aperta ? (
                <span class="dritta">
                  {' · '}
                  {completa(scelti, pg)
                    ? 'pronti'
                    : `scegline ancora ${pg.limitePreparati - scelti.length}`}
                </span>
              ) : (
                ' preparati'
              )}
            </span>
            {aperta ? (
              // Sbloccare due volte non vuol dire niente: aperta, il comando
              // diventa il nome dello stato.
              <span class="aperta">sbloccata</span>
            ) : (
              // Non dice più chi concede il permesso: si dà per scontato, e
              // l'etichetta torna a dire cosa fa il tocco.
              <button type="button" class="sblocca" onClick={() => apri(s.preparati)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 11h10v8H7z" />
                  <path d="M9 11V7.5a3 3 0 0 1 5.7-1.3" />
                </svg>
                Sblocca
              </button>
            )}
          </>,
          cappello,
        )}

      {aperta && (
        <div class="barra-preparazione" role="group" aria-label="Sessione di preparazione">
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
      )}
    </>
  );
}
