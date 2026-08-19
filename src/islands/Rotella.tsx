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
  // Se la posizione l'abbiamo scritta davvero. Su un elemento fuori dal
  // layout — ed è dove sta la pista finché la modale è chiusa — assegnare
  // `scrollTop` non attacca: la pista resta a zero, e quello zero non è la
  // cifra di nessuno. È il difetto che in pagina si leggeva «SPENDI 0».
  const posizionato = useRef(false);

  /** Rimette la pista sul numero scelto. */
  const posiziona = (nodo: HTMLDivElement, n: number): void => {
    nodo.scrollTop = scorrimentoDaValore(n, PASSO, minimo, massimo);
  };

  /** Se la pista può scorrere. È la stessa domanda che si fa `leggi`, ed è
   *  l'unica con una risposta certa: se può scorrere, era disposta, e la
   *  scrittura di `scrollTop` è arrivata dove doveva.
   *
   *  Prima qui si confrontava il pixel scritto con quello riletto subito dopo.
   *  In fondo alla corsa, o con un aggancio ancora in movimento, quei due
   *  numeri possono non coincidere: bastava un disaccordo perché la pista
   *  risultasse «mai posizionata» e ogni scorsa venisse ingoiata e riportata
   *  dov'era. Ai numeri di mezzo non si notava; a trenta la rotella non tornava
   *  più indietro. */
  const disposta = (nodo: HTMLDivElement): boolean => nodo.scrollHeight > nodo.clientHeight;

  useEffect(() => {
    const nodo = pista.current;
    if (!nodo) return;
    atteso.current = valore;
    // Fuori dal layout — ed è dove sta la pista finché la modale è chiusa —
    // assegnare `scrollTop` non attacca: si rifarà alla prima occasione utile.
    posizionato.current = disposta(nodo);
    posiziona(nodo, valore);
  }, [valore, minimo, massimo]);

  const leggi = () => {
    const nodo = pista.current;
    if (!nodo) return;
    // Finché il browser non ha disposto la pista non c'è niente da leggere:
    // una pista che non può scorrere sta ferma a zero.
    if (!disposta(nodo)) return;
    // Disposta adesso ma mai posizionata: questa è la prima occasione di
    // rimettere la pista dov'era, non una girata da riferire. Una volta sola —
    // da qui in poi quel che si legge è una scelta.
    if (!posizionato.current) {
      posizionato.current = true;
      posiziona(nodo, valore);
      return;
    }
    const n = valoreDaScorrimento(nodo.scrollTop, PASSO, minimo, massimo);
    if (n === atteso.current) return;
    atteso.current = n;
    onCambia(n);
  };

  /** Un passo solo, di qua o di là. Lo condividono le frecce e la tastiera:
   *  sono lo stesso gesto detto in due modi. */
  const gira = (verso: number) => {
    const n = Math.min(massimo, Math.max(minimo, valore + verso));
    if (n === valore) return;
    atteso.current = n;
    onCambia(n);
  };

  const tasto = (e: KeyboardEvent) => {
    const passi: Record<string, number> = { ArrowUp: 1, ArrowDown: -1 };
    const verso = passi[e.key];
    if (verso === undefined) return;
    e.preventDefault();
    gira(verso);
  };

  return (
    <div class="rotella-colonna">
      <button
        type="button"
        class="freccia freccia-su"
        aria-label="Aumenta di uno"
        disabled={valore >= massimo}
        onClick={() => gira(1)}
      >
        <Cuspide verso="su" />
      </button>

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

      <button
        type="button"
        class="freccia freccia-giu"
        aria-label="Diminuisci di uno"
        disabled={valore <= minimo}
        onClick={() => gira(-1)}
      >
        <Cuspide verso="giu" />
      </button>
    </div>
  );
}

/** La punta della freccia. Disegnata, non scritta: i caratteri ▲ e ▼ cambiano
 *  peso e allineamento da un dispositivo all'altro, e uno dei due esce spesso
 *  come emoji. Il nome del bottone lo porta `aria-label`, quindi qui non c'è
 *  niente da leggere. */
function Cuspide({ verso }: { verso: 'su' | 'giu' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points={verso === 'su' ? '5 15 12 8 19 15' : '5 9 12 16 19 9'} />
    </svg>
  );
}
