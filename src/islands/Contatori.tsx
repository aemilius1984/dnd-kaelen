import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { dichiara } from '@/lib/annulla';
import { puoUsareRisorsa, recuperaRisorsa, usaRisorsa } from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';
import { sigilloUso } from '@/lib/sigilli';

type Contatore = { nodo: HTMLElement; id: string };
/** Un posto dove va un comando: `idUso` c'è quando la risorsa ha più usi fra
 *  cui scegliere, e allora il contenitore sta dentro la modale. */
type Comando = { nodo: HTMLElement; id: string; idUso?: string };

/** Le caselle delle capacità e i comandi che le consumano, disegnati dentro le
 *  card statiche per portale — stesso schema di `ControlliLancio`.
 *
 *  Era di sola lettura: si spendeva dal pannello ⚡, cioè da un elenco lontano
 *  dalla capacità, dove bisognava ricordarsi quale riga corrispondesse a cosa.
 *  Adesso si spende dove la capacità è scritta, e il gesto è annullabile come
 *  un lancio. */
export default function Contatori() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const [contatori, setContatori] = useState<Contatore[]>([]);
  const [comandi, setComandi] = useState<Comando[]>([]);

  // I contenitori sono markup statico generato in build: li troviamo una volta
  // sola e ci disegniamo dentro.
  useEffect(() => {
    setContatori(
      [...document.querySelectorAll<HTMLElement>('[data-caselle]')].map((nodo) => ({
        nodo,
        id: nodo.dataset.caselle ?? '',
      })),
    );
    setComandi([
      ...[...document.querySelectorAll<HTMLElement>('[data-spendi]')].map((nodo) => ({
        nodo,
        id: nodo.dataset.spendi ?? '',
      })),
      ...[...document.querySelectorAll<HTMLElement>('[data-uso]')].map((nodo) => ({
        nodo,
        id: nodo.dataset.risorsa ?? '',
        idUso: nodo.dataset.uso,
      })),
    ]);
  }, []);

  // Spegne la card quando non resta una carica da spendere. Stessa forma di
  // `ControlliLancio` sulle carte degli incantesimi: il markup è statico,
  // l'isola gli cambia un attributo addosso. Spenta e non nascosta — la
  // descrizione e la frase di recupero restano leggibili, e sono proprio
  // quelle che si guardano per decidere se conviene un Riposo Breve.
  useEffect(() => {
    for (const r of pg.risorse) {
      const carta = document.querySelector<HTMLElement>(`[data-capacita="${r.id}"]`);
      if (!carta) continue;
      const spenta = !puoUsareRisorsa(s, pg, r.id);
      carta.classList.toggle('spenta', spenta);
      if (spenta) carta.setAttribute('aria-disabled', 'true');
      else carta.removeAttribute('aria-disabled');
    }
  }, [s.risorseUsate, pg]);

  function spendi(nodo: HTMLElement, id: string, idUso: string | undefined, detto: string) {
    // Chi ha speso viaggia con la spesa: la casella consumata deve poter
    // mostrare il sigillo di *questo* uso, non un pallino qualunque.
    muta((x) => usaRisorsa(x, pg, id, idUso ?? id));
    // Scelto l'uso, la modale ha finito: resta aperta e coprirebbe la striscia
    // di annullamento, che è l'unico segno che la spesa è avvenuta.
    nodo.closest('dialog')?.close();
    dichiara({
      detto,
      costo: 'Una carica spesa',
      disfa: () => muta((x) => recuperaRisorsa(x, id)),
    });
  }

  return (
    <>
      {contatori.map((b) => {
        const risorsa = pg.risorse.find((r) => r.id === b.id);
        if (!risorsa) return null;
        const spese = s.risorseUsate[b.id] ?? [];
        return createPortal(
          <span class="caselle" aria-label={`${risorsa.max - spese.length} di ${risorsa.max} usi`}>
            {Array.from({ length: risorsa.max }, (_, i) => {
              // Le caselle si consumano da destra, come le file di slot: la
              // prima spesa resta dov'è quando ne arriva un'altra. Se si
              // rimescolassero, guardare la fila non direbbe più niente.
              if (i < risorsa.max - spese.length) return <i key={i} class="casella piena" />;
              const da = spese[risorsa.max - 1 - i];
              // Una risorsa con un uso solo non ha un sigillo da mostrare: il
              // disegno sarebbe sempre lo stesso, e la casella piena lo dice
              // già. Vale anche per la spesa fatta a mano dal pannello ⚡.
              const uso = risorsa.usi?.find((u) => u.id === da);
              if (!uso) return <i key={i} class="casella manuale" />;
              return (
                <i key={i} class="casella usata">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <use href={`#${sigilloUso(uso.id)}`} />
                  </svg>
                </i>
              );
            })}
          </span>,
          b.nodo,
        );
      })}

      {comandi.map((c) => {
        const risorsa = pg.risorse.find((r) => r.id === c.id);
        if (!risorsa) return null;
        // A secco il comando non c'è: un bottone che non fa niente è peggio di
        // un bottone assente, perché al tavolo si preme e si crede di aver
        // speso. Quel che resta è la frase di recupero, che dice come tornare
        // ad averne.
        if (!puoUsareRisorsa(s, pg, c.id)) {
          return createPortal(<span class="tenue">Niente da spendere.</span>, c.nodo);
        }
        const uso = risorsa.usi?.find((u) => u.id === c.idUso);
        const detto = uso?.nome ?? risorsa.nome;
        return createPortal(
          <button type="button" onClick={() => spendi(c.nodo, c.id, c.idUso, detto)}>
            {uso ? `Usa ${uso.nome}` : `Usa ${risorsa.nome}`}
          </button>,
          c.nodo,
        );
      })}
    </>
  );
}
