import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { dichiara } from '@/lib/annulla';
import { caselle } from '@/lib/caselle';
import { aggiungiOggettoIndossandolo, consuma, consumabili, restituisci } from '@/lib/oggetti';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';
import ModuloOggetto from '@/islands/parti/ModuloOggetto';

/** Fino a quante cariche si disegnano a caselle. Oltre si scrive il numero:
 *  sette quadratini per le razioni sono un conto che nessuno legge a colpo
 *  d'occhio, e le razioni non si spendono in combattimento. */
const MAX_CASELLE = 5;

type Innesto = { nodo: HTMLElement; id: string };

/** Cariche e comandi dei consumabili, disegnati dentro le carte statiche per
 *  portale — stesso schema di `Contatori`. Gli oggetti raccolti al tavolo, che
 *  il build non può conoscere, l'isola li disegna per intero. */
export default function Consumabili() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const elenco = consumabili(pg, s);

  const [conta, setConta] = useState<Innesto[]>([]);
  const [comandi, setComandi] = useState<Innesto[]>([]);
  const [miei, setMiei] = useState<HTMLElement | null>(null);
  const [modulo, setModulo] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const trova = (attributo: string) =>
      [...document.querySelectorAll<HTMLElement>(`[${attributo}]`)].map((nodo) => ({
        nodo,
        id: nodo.getAttribute(attributo) ?? '',
      }));
    setConta(trova('data-cariche'));
    setComandi(trova('data-consuma'));
    setMiei(document.querySelector<HTMLElement>('[data-consumabili-miei]'));
    setModulo(document.querySelector<HTMLElement>('[data-modulo-oggetto]'));
  }, []);

  function spendi(voce: { id: string; nome: string }) {
    muta((x) => consuma(x, voce.id));
    // Stessa grammatica di una carica: un gesto solo, irreversibile, fatto col
    // pollice mentre qualcun altro parla. La striscia è quella di sempre.
    dichiara({
      detto: voce.nome,
      costo: 'Uno in meno',
      disfa: () => muta((x) => restituisci(x, voce.id)),
    });
  }

  const cariche = (quantita: number) =>
    quantita > MAX_CASELLE ? (
      <span class="valore">{quantita}</span>
    ) : (
      <span class="caselle" aria-label={`${quantita} rimasti`}>
        {caselle(0, quantita).map((_, i) => (
          <i key={i} class="casella piena" />
        ))}
      </span>
    );

  const comando = (voce: { id: string; nome: string; quantita: number }) =>
    voce.quantita === 0 ? (
      // Un bottone che non fa niente è peggio di un bottone assente: al tavolo
      // si preme e si crede di aver speso.
      <span class="tenue">Finito.</span>
    ) : (
      <button type="button" onClick={() => spendi(voce)}>
        Usa
      </button>
    );

  return (
    <>
      {conta.map((i) => {
        const voce = elenco.find((v) => v.id === i.id);
        return voce ? createPortal(cariche(voce.quantita), i.nodo) : null;
      })}

      {comandi.map((i) => {
        const voce = elenco.find((v) => v.id === i.id);
        return voce ? createPortal(comando(voce), i.nodo) : null;
      })}

      {miei &&
        createPortal(
          <>
            {elenco
              .filter((v) => v.mio)
              .map((v) => (
                // Stessa riga di `Consumabili.astro`, scritta a mano perché
                // un'isola Preact non può montare un componente `.astro`. Il
                // filetto ambra sul fianco è lo stesso segno che sulle carte
                // incantesimo distingue il dominio, e con la stessa tecnica:
                // un'ombra interna, non un bordo, che sposterebbe di tre pixel
                // il sigillo e romperebbe la colonna.
                <div key={v.id} class="consumabile mio">
                  <div class="riga-consumabile">
                    <svg class="sigillo" viewBox="0 0 24 24" aria-hidden="true">
                      <use href="#sig-consumabile" />
                    </svg>
                    <span class="chi">
                      <span class="titolo">{v.nome}</span>
                      {/* Niente `nomeEn` su quel che si raccoglie al tavolo:
                          non viene da un manuale e non ha un nome inglese da
                          cercare. Resta la nota, nella stessa riga in mono. */}
                      {v.nota && <span class="sotto">{v.nota}</span>}
                    </span>
                    <span class="cariche" data-cariche={v.id}>
                      {cariche(v.quantita)}
                    </span>
                    <span class="spendi" data-consuma={v.id}>
                      {comando(v)}
                    </span>
                  </div>
                </div>
              ))}
          </>,
          miei,
        )}

      {modulo &&
        createPortal(
          <ModuloOggetto
            onSalva={(dati) => muta((x) => aggiungiOggettoIndossandolo(x, dati))}
            caratteristiche={pg.caratteristiche}
            onChiudi={() => document.querySelector<HTMLDialogElement>('#aggiungi-oggetto')?.close()}
          />,
          modulo,
        )}
    </>
  );
}
