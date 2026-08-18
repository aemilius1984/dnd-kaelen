import { useEffect, useRef } from 'preact/hooks';
import { MASSIMO, MINIMO, PASSO, scorrimentoDaValore, valoreDaScorrimento } from '@/lib/rotella';

interface Props {
  valore: number;
  onCambia: (n: number) => void;
  /** Gli estremi sono regolabili perché la stessa rotella serve due scopi: una
   *  quantità di PF da 0 a 30, e — quando Kaelen è a terra — il d20 del tiro
   *  salvezza contro morte, che va da 1 a 20. Una rotella sola, due intervalli:
   *  è un gesto già imparato invece di un controllo nuovo. */
  minimo?: number;
  massimo?: number;
}

/** La colonna di numeri che si gira col dito. Non sa cosa sia un punto ferita:
 *  produce un numero e lo consegna a chi l'ha montata. */
export default function Rotella({ valore, onCambia, minimo = MINIMO, massimo = MASSIMO }: Props) {
  const cifre = Array.from({ length: massimo - minimo + 1 }, (_, i) => minimo + i);
  const pista = useRef<HTMLDivElement>(null);
  // Chi ha scritto per ultimo la posizione. Scrivere `scrollTop` fa scattare
  // un evento `scroll`, che senza questa memoria rimbalzerebbe indietro come
  // se fosse stato l'utente a girare.
  const atteso = useRef(valore);

  useEffect(() => {
    const nodo = pista.current;
    if (!nodo) return;
    atteso.current = valore;
    nodo.scrollTop = scorrimentoDaValore(valore, PASSO, minimo, massimo);
  }, [valore, minimo, massimo]);

  const leggi = () => {
    const nodo = pista.current;
    if (!nodo) return;
    const n = valoreDaScorrimento(nodo.scrollTop, PASSO, minimo, massimo);
    if (n === atteso.current) return;
    atteso.current = n;
    onCambia(n);
  };

  const tasto = (e: KeyboardEvent) => {
    const passi: Record<string, number> = { ArrowUp: 1, ArrowDown: -1 };
    const verso = passi[e.key];
    if (verso === undefined) return;
    e.preventDefault();
    const n = Math.min(massimo, Math.max(minimo, valore + verso));
    if (n === valore) return;
    atteso.current = n;
    onCambia(n);
  };

  return (
    <div class="rotella">
      <div
        class="pista"
        ref={pista}
        role="spinbutton"
        tabIndex={0}
        aria-label="Quantità"
        aria-valuenow={valore}
        aria-valuemin={minimo}
        aria-valuemax={massimo}
        onScroll={leggi}
        onKeyDown={tasto}
      >
        {cifre.map((n) => (
          <div class={n === valore ? 'cifra scelta' : 'cifra'} key={n}>
            {n}
          </div>
        ))}
      </div>
      <div class="banda" aria-hidden="true"></div>
      <div class="sfumatura" aria-hidden="true"></div>
    </div>
  );
}
