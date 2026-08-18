import { beforeEach, describe, expect, it } from 'vitest';
import { creaBarra, ISTERESI, SOGLIA } from '@/lib/barra-scroll';

/** Un finto ambiente: la barra non tocca il DOM, riceve le sue quattro
 *  dipendenze e le esercita. Così la regola di comparsa si prova senza un
 *  browser — che qui non c'è. */
function ambiente(y = 0) {
  const registro = { applicato: [] as boolean[], chiusure: 0 };
  let aperto = false;
  return {
    registro,
    apri: () => (aperto = true),
    scorriA(nuova: number) {
      y = nuova;
    },
    amb: {
      leggiY: () => y,
      aperto: () => aperto,
      applica: (nascosta: boolean) => registro.applicato.push(nascosta),
      chiudi: () => {
        aperto = false;
        registro.chiusure++;
      },
    },
  };
}

describe('la barra si nasconde in giù e torna in su', () => {
  let scena: ReturnType<typeof ambiente>;
  let barra: ReturnType<typeof creaBarra>;

  beforeEach(() => {
    scena = ambiente(0);
    barra = creaBarra(scena.amb);
  });

  it('scorrendo in giù oltre la soglia si nasconde', () => {
    scena.scorriA(SOGLIA + 200);
    barra.scorri();

    expect(scena.registro.applicato).toEqual([true]);
  });

  it('e appena si torna in su riappare', () => {
    scena.scorriA(SOGLIA + 200);
    barra.scorri();
    scena.scorriA(SOGLIA + 120);
    barra.scorri();

    expect(scena.registro.applicato).toEqual([true, false]);
  });

  it('nella fascia in cima allo scroll non si nasconde mai', () => {
    // Lì la barra non ruba spazio a niente: nasconderla sarebbe solo un
    // tremolio a ogni piccolo movimento in cima alla pagina.
    scena.scorriA(SOGLIA - 1);
    barra.scorri();

    expect(scena.registro.applicato).toEqual([]);
  });

  it('tornando in cima riappare anche a piccoli passi', () => {
    // L'isteresi non deve poter tenere la barra nascosta una volta in cima:
    // uno scroll che si ferma a pochi pixel dal bordo la lascerebbe sparita.
    scena.scorriA(SOGLIA + 200);
    barra.scorri();
    scena.scorriA(2);
    barra.scorri();

    expect(scena.registro.applicato).toEqual([true, false]);
  });

  it('i movimenti più piccoli dell’isteresi non la fanno saltare', () => {
    // Lo scroll per inerzia di iOS arriva a pixel: senza soglia la barra
    // sbatterebbe dentro e fuori a ogni frame.
    scena.scorriA(SOGLIA + 200);
    barra.scorri();
    scena.scorriA(SOGLIA + 200 + (ISTERESI - 1));
    barra.scorri();
    scena.scorriA(SOGLIA + 200 - (ISTERESI - 1));
    barra.scorri();

    expect(scena.registro.applicato).toEqual([true]);
  });

  it('non riapplica uno stato che è già quello attuale', () => {
    // `applica` scrive nel DOM e gira dentro lo scroll: chiamarla per dire
    // ciò che vale già è lavoro sul thread che deve restare libero.
    for (const y of [300, 600, 900]) {
      scena.scorriA(y);
      barra.scorri();
    }

    expect(scena.registro.applicato).toEqual([true]);
  });

  it('a menu aperto lo scroll non la porta via', () => {
    // Portarsi via la barra mentre il pannello ci pende sotto lascerebbe il
    // pannello attaccato al nulla, e la × fuori dallo schermo.
    scena.apri();
    scena.scorriA(SOGLIA + 400);
    barra.scorri();

    expect(scena.registro.applicato).toEqual([]);
  });

  it('aprire il menu mentre è nascosta la fa tornare', () => {
    scena.scorriA(SOGLIA + 200);
    barra.scorri();
    scena.apri();
    barra.apertura();

    expect(scena.registro.applicato).toEqual([true, false]);
  });

  it('una y negativa da rimbalzo elastico vale zero', () => {
    // Su iOS lo scroll oltre il bordo dà valori negativi: trattati come
    // discesa, nasconderebbero la barra proprio mentre si tira verso il basso.
    scena.scorriA(SOGLIA + 200);
    barra.scorri();
    scena.scorriA(-40);
    barra.scorri();

    expect(scena.registro.applicato).toEqual([true, false]);
  });
});

describe('le due vie di uscita dal menu', () => {
  it('Escape chiude solo se il menu è aperto', () => {
    const scena = ambiente(0);
    const barra = creaBarra(scena.amb);

    barra.tasto('Escape');
    expect(scena.registro.chiusure).toBe(0);

    scena.apri();
    barra.tasto('Escape');
    expect(scena.registro.chiusure).toBe(1);
  });

  it('un altro tasto non chiude niente', () => {
    const scena = ambiente(0);
    const barra = creaBarra(scena.amb);
    scena.apri();

    barra.tasto('Enter');

    expect(scena.registro.chiusure).toBe(0);
  });

  it('il tocco fuori chiude, quello dentro no', () => {
    const scena = ambiente(0);
    const barra = creaBarra(scena.amb);
    scena.apri();

    barra.tocco(true);
    expect(scena.registro.chiusure).toBe(0);

    barra.tocco(false);
    expect(scena.registro.chiusure).toBe(1);
  });
});
