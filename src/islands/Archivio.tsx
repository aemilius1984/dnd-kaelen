import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { puoPreparare, togglePreparato } from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

type Bersaglio = { nodo: HTMLElement; slug: string };

/** Le sole spunte di preparazione. L'elenco dei trentanove incantesimi è
 *  markup statico reso da `ElencoArchivio.astro`: quest'isola non lo produce,
 *  ci disegna dentro per portale — stesso schema di `ControlliLancio` e
 *  `Contatori`.
 *
 *  Non sa dove si trova: gira identica dentro il `<dialog>` della Scheda e come
 *  contenuto della rotta `/preparati/`. Le regole — limite di sei, dominio e
 *  trucchetti mai preparabili — stanno in `togglePreparato`, non qui. */
export default function Archivio() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const [bersagli, setBersagli] = useState<Bersaglio[]>([]);

  useEffect(() => {
    setBersagli(
      [...document.querySelectorAll<HTMLElement>('[data-preparabile]')].map((nodo) => ({
        nodo,
        slug: nodo.dataset.preparabile ?? '',
      })),
    );
  }, []);

  const pieno = !puoPreparare(s, pg);

  return (
    <>
      {bersagli.map((b) => {
        const scelto = s.preparati.includes(b.slug);
        return createPortal(
          <label class={scelto ? 'prepara scelto' : 'prepara'}>
            <input
              type="checkbox"
              checked={scelto}
              // A limite raggiunto restano attive solo le spunte già messe,
              // così togliere è sempre possibile e aggiungere no.
              disabled={!scelto && pieno}
              onChange={() => muta((x) => togglePreparato(x, pg, b.slug))}
            />
            <span class="etichetta-prepara">{scelto ? 'preparato' : 'prepara'}</span>
          </label>,
          b.nodo,
        );
      })}
    </>
  );
}
