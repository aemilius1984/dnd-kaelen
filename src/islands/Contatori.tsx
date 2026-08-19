import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { assicuraInizializzato, datiIniziali, stato } from '@/lib/storage';
import { caselle } from '@/lib/caselle';

type Bersaglio = { nodo: HTMLElement; id: string };

/** Disegna le caselle dentro le card statiche delle capacità, per portale —
 *  stesso schema di `ControlliLancio`. Il contatore sta accanto alla cosa che
 *  lo consuma, non in un elenco separato dove bisogna ricordarsi a che serve.
 *
 *  Sola lettura, come prima: si spende dal pannello azioni. */
export default function Contatori() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const [bersagli, setBersagli] = useState<Bersaglio[]>([]);

  // I contenitori sono markup statico generato in build: li troviamo una volta
  // sola e ci disegniamo dentro.
  useEffect(() => {
    setBersagli(
      [...document.querySelectorAll<HTMLElement>('[data-caselle]')].map((nodo) => ({
        nodo,
        id: nodo.dataset.caselle ?? '',
      })),
    );
  }, []);

  return (
    <>
      {bersagli.map((b) => {
        const risorsa = pg.risorse.find((r) => r.id === b.id);
        if (!risorsa) return null;
        const usate = (s.risorseUsate[b.id] ?? []).length;
        return createPortal(
          <span class="caselle" aria-label={`${risorsa.max - usate} di ${risorsa.max} usi`}>
            {caselle(usate, risorsa.max).map((piena, i) => (
              <i key={i} class={piena ? 'casella piena' : 'casella'} />
            ))}
          </span>,
          b.nodo,
        );
      })}
    </>
  );
}
