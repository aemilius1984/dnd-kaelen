import { useEffect, useRef } from 'preact/hooks';
import { MASSIMO, MINIMO, PASSO, scorrimentoDaValore, valoreDaScorrimento } from '@/lib/rotella';

interface Props {
  valore: number;
  onCambia: (n: number) => void;
}

const CIFRE = Array.from({ length: MASSIMO - MINIMO + 1 }, (_, i) => MINIMO + i);

/** La colonna di numeri che si gira col dito. Non sa cosa sia un punto ferita:
 *  produce una quantità e la consegna a chi l'ha montata. */
export default function Rotella({ valore, onCambia }: Props) {
  const pista = useRef<HTMLDivElement>(null);
  // Chi ha scritto per ultimo la posizione. Scrivere `scrollTop` fa scattare
  // un evento `scroll`, che senza questa memoria rimbalzerebbe indietro come
  // se fosse stato l'utente a girare.
  const atteso = useRef(valore);

  useEffect(() => {
    const nodo = pista.current;
    if (!nodo) return;
    atteso.current = valore;
    nodo.scrollTop = scorrimentoDaValore(valore, PASSO, MINIMO, MASSIMO);
  }, [valore]);

  const leggi = () => {
    const nodo = pista.current;
    if (!nodo) return;
    const n = valoreDaScorrimento(nodo.scrollTop, PASSO, MINIMO, MASSIMO);
    if (n === atteso.current) return;
    atteso.current = n;
    onCambia(n);
  };

  const tasto = (e: KeyboardEvent) => {
    const passi: Record<string, number> = { ArrowUp: 1, ArrowDown: -1 };
    const verso = passi[e.key];
    if (verso === undefined) return;
    e.preventDefault();
    const n = Math.min(MASSIMO, Math.max(MINIMO, valore + verso));
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
        aria-valuemin={MINIMO}
        aria-valuemax={MASSIMO}
        onScroll={leggi}
        onKeyDown={tasto}
      >
        {CIFRE.map((n) => (
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
