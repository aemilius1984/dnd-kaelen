import { describe, expect, it } from 'vitest';
import { MASSIMO, MINIMO, PASSO, scorrimentoDaValore, valoreDaScorrimento } from '@/lib/rotella';

describe('dalla posizione al numero', () => {
  it('ogni passo di scorrimento vale una cifra', () => {
    expect(valoreDaScorrimento(0, PASSO, MINIMO, MASSIMO)).toBe(0);
    expect(valoreDaScorrimento(PASSO, PASSO, MINIMO, MASSIMO)).toBe(1);
    expect(valoreDaScorrimento(PASSO * 7, PASSO, MINIMO, MASSIMO)).toBe(7);
  });

  it('a metà passo si aggancia alla cifra più vicina', () => {
    // `scroll-snap` porta sempre a un aggancio, ma la lettura avviene *anche*
    // mentre il dito trascina: lì la posizione è qualunque cosa.
    expect(valoreDaScorrimento(PASSO * 3 + PASSO * 0.4, PASSO, MINIMO, MASSIMO)).toBe(3);
    expect(valoreDaScorrimento(PASSO * 3 + PASSO * 0.6, PASSO, MINIMO, MASSIMO)).toBe(4);
  });

  it('una posizione negativa da rimbalzo elastico vale il minimo', () => {
    // Su iOS lo scorrimento oltre il bordo dà valori negativi: non sono una
    // cifra sotto lo zero, sono il dito che tira contro il fermo.
    expect(valoreDaScorrimento(-120, PASSO, MINIMO, MASSIMO)).toBe(MINIMO);
  });

  it('oltre l’ultima cifra si ferma al massimo', () => {
    expect(valoreDaScorrimento(PASSO * 999, PASSO, MINIMO, MASSIMO)).toBe(MASSIMO);
  });
});

describe('dal numero alla posizione', () => {
  it('riporta ogni cifra sotto la banda di scelta', () => {
    expect(scorrimentoDaValore(0, PASSO, MINIMO, MASSIMO)).toBe(0);
    expect(scorrimentoDaValore(5, PASSO, MINIMO, MASSIMO)).toBe(PASSO * 5);
  });

  it('è l’inverso esatto dell’andata, per ogni cifra dell’intervallo', () => {
    // Serve perché la rotella si riposiziona da sola: all'apertura, e ogni
    // volta che il campo «digita» impone un numero. Se andata e ritorno non
    // combaciano, la rotella scatta di una cifra a ogni riapertura.
    for (let n = MINIMO; n <= MASSIMO; n++) {
      const dove = scorrimentoDaValore(n, PASSO, MINIMO, MASSIMO);
      expect(valoreDaScorrimento(dove, PASSO, MINIMO, MASSIMO)).toBe(n);
    }
  });

  it('un valore fuori intervallo viene riportato dentro', () => {
    expect(scorrimentoDaValore(-4, PASSO, MINIMO, MASSIMO)).toBe(0);
    expect(scorrimentoDaValore(500, PASSO, MINIMO, MASSIMO)).toBe(PASSO * MASSIMO);
  });
});

describe('la guardia sul passo', () => {
  it('un passo nullo o negativo è un errore di programmazione, non un caso', () => {
    // Dividere per zero darebbe Infinity, che diventerebbe un numero di PF
    // e finirebbe salvato in localStorage.
    expect(() => valoreDaScorrimento(80, 0, MINIMO, MASSIMO)).toThrow();
    expect(() => scorrimentoDaValore(2, -8, MINIMO, MASSIMO)).toThrow();
  });
});
