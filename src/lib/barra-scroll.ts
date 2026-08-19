/** La barra in cima si toglie di mezzo quando si legge scendendo e torna
 *  appena si risale. Il CSS da solo non ci arriva: sa dire *quanto* si è
 *  scorso, non in che *direzione*, e la direzione è tutta la regola.
 *
 *  Qui dentro non compare né `window` né `document`. Le quattro cose che
 *  servono arrivano da fuori, come per `azzeraSessione`: la decisione si prova
 *  con vitest, e nel browser resta solo il cablaggio in `Menu.astro`. */

/** Fascia in cima allo scroll dove la barra sta comunque. Sotto questa quota
 *  non ruba spazio a nulla, e nasconderla sarebbe solo tremolio. */
export const SOGLIA = 64;

/** Movimento minimo perché la barra cambi idea. Lo scroll per inerzia di iOS
 *  arriva un pixel alla volta e cambia segno di continuo: senza questa soglia
 *  la barra sbatterebbe dentro e fuori a ogni frame. */
export const ISTERESI = 6;

export interface Ambiente {
  /** Quanto si è scorso, in pixel dall'alto. */
  leggiY: () => number;
  /** Se il pannello del menu è aperto adesso. */
  aperto: () => boolean;
  /** Scrive lo stato nel DOM. Chiamata solo quando lo stato cambia davvero. */
  applica: (nascosta: boolean) => void;
  /** Chiude il pannello. */
  chiudi: () => void;
}

export interface Barra {
  /** Da chiamare a ogni scroll, già ridotta a un frame per volta. */
  scorri: () => void;
  /** Da chiamare a ogni tasto premuto. */
  tasto: (nome: string) => void;
  /** Da chiamare a ogni tocco: `dentro` dice se è caduto sulla barra. */
  tocco: (dentro: boolean) => void;
  /** Da chiamare quando il pannello si apre. */
  apertura: () => void;
}

export function creaBarra(amb: Ambiente): Barra {
  // Il rimbalzo elastico di iOS dà y negative oltre il bordo: prese com'è,
  // il ritorno da -40 a 0 sarebbe una discesa e nasconderebbe la barra
  // proprio mentre l'utente tira verso il basso.
  const quota = () => Math.max(0, amb.leggiY());

  let ultima = quota();
  let nascosta = false;

  const vai = (verso: boolean) => {
    if (verso === nascosta) return;
    nascosta = verso;
    amb.applica(verso);
  };

  return {
    scorri() {
      const y = quota();
      const inCima = y <= SOGLIA;
      // La fascia in cima scavalca l'isteresi: se non lo facesse, uno scroll
      // che si ferma a pochi pixel dal bordo lascerebbe la barra sparita.
      if (!inCima && Math.abs(y - ultima) < ISTERESI) return;
      const scende = y > ultima;
      ultima = y;
      vai(!inCima && !amb.aperto() && scende);
    },

    tasto(nome) {
      if (nome === 'Escape' && amb.aperto()) amb.chiudi();
    },

    tocco(dentro) {
      if (!dentro && amb.aperto()) amb.chiudi();
    },

    apertura() {
      // Il pannello pende dalla barra: aprirlo mentre la barra è fuori
      // schermo lo lascerebbe attaccato al nulla, con la × irraggiungibile.
      vai(false);
    },
  };
}
