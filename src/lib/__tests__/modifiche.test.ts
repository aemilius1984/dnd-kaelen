import { describe, expect, it } from 'vitest';
import { caratteristicaEnum } from '@/lib/schema';
import {
  caratteristicheModificabili,
  componiPunteggi,
  componiVoci,
  modificaSchema,
  vociFinali,
  type Modifica,
} from '@/lib/modifiche';

describe('i punteggi non si sommano: vince il più alto', () => {
  it('due oggetti che impostano la stessa caratteristica non fanno 41', () => {
    const m: Modifica[] = [
      { genere: 'punteggio', bersaglio: 'for', valore: 21 },
      { genere: 'punteggio', bersaglio: 'for', valore: 20 },
    ];
    expect(componiPunteggi(m)).toEqual({ for: 21 });
  });

  it('caratteristiche diverse convivono', () => {
    const m: Modifica[] = [
      { genere: 'punteggio', bersaglio: 'for', valore: 19 },
      { genere: 'punteggio', bersaglio: 'des', valore: 18 },
    ];
    expect(componiPunteggi(m)).toEqual({ for: 19, des: 18 });
  });

  it('le voci finali non entrano nei punteggi', () => {
    expect(componiPunteggi([{ genere: 'voce', bersaglio: 'ca', valore: 2 }])).toEqual({});
  });
});

describe('le voci finali si sommano davvero', () => {
  it('Scudo della Fede e uno scudo magico fanno tre punti di CA', () => {
    const m: Modifica[] = [
      { genere: 'voce', bersaglio: 'ca', valore: 2 },
      { genere: 'voce', bersaglio: 'ca', valore: 1 },
    ];
    expect(componiVoci(m).ca).toBe(3);
  });

  it('le voci non toccate valgono zero, non undefined', () => {
    expect(componiVoci([])).toEqual({ ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 });
  });

  it('gli addendi negativi sottraggono', () => {
    expect(componiVoci([{ genere: 'voce', bersaglio: 'prove', valore: -4 }]).prove).toBe(-4);
  });
});

describe('lo schema', () => {
  it('rifiuta una caratteristica messa fra le voci finali', () => {
    expect(modificaSchema.safeParse({ genere: 'voce', bersaglio: 'for', valore: 1 }).success).toBe(
      false,
    );
  });

  it('rifiuta una voce finale messa fra i punteggi', () => {
    expect(
      modificaSchema.safeParse({ genere: 'punteggio', bersaglio: 'ca', valore: 1 }).success,
    ).toBe(false);
  });

  it('accetta le due forme legittime', () => {
    expect(modificaSchema.parse({ genere: 'punteggio', bersaglio: 'for', valore: 21 })).toEqual({
      genere: 'punteggio',
      bersaglio: 'for',
      valore: 21,
    });
    expect(modificaSchema.parse({ genere: 'voce', bersaglio: 'ca', valore: 2 })).toEqual({
      genere: 'voce',
      bersaglio: 'ca',
      valore: 2,
    });
  });
});

it('le sei caratteristiche sono le stesse dello schema del personaggio', () => {
  // Due elenchi copiati a mano divergono al primo aumento di punteggio. Questo
  // modulo non può importare `caratteristicaEnum` — creerebbe un ciclo con
  // `schema.ts`, che importa `modificaSchema` — quindi la guardia sta qui.
  expect([...caratteristicheModificabili]).toEqual([...caratteristicaEnum.options]);
});

it('le voci finali sono cinque e non di più', () => {
  // Aggiungerne una è una decisione: vuol dire che esiste un numero in pagina
  // che qualcuno deve poter modificare, e che qualcuno deve andarci a scrivere.
  expect([...vociFinali]).toEqual(['ca', 'ts', 'colpire', 'prove', 'velocita']);
});
