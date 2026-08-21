import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale, type StatoSessione } from '@/lib/sheet-state';
import { accendiEffetto, impostaEsaurimento, nuovoIdEffetto } from '@/lib/effetti';
import { aggiungiOggetto, commutaIndossato } from '@/lib/oggetti';
import { kaelenAdesso, modificheEsaurimento, riassuntoVoci } from '@/lib/adesso';
import {
  bonusAbilita,
  bonusTiroSalvezza,
  capacitaTrasporto,
  cdIncantesimi,
  classeArmatura,
  dannoTesto,
  modificatore,
  perColpire,
} from '@/lib/derive';
import type { Modifica } from '@/lib/modifiche';

const pg = caricaPersonaggioDaFile();
let s: StatoSessione;

beforeEach(() => {
  s = statoIniziale(pg, 'v-test');
});

const effetto = (nome: string, modifiche: Modifica[], parti = {}) => ({
  id: nuovoIdEffetto(),
  nome,
  durata: '10 minuti',
  concentrazione: false,
  modifiche,
  accesoIl: new Date().toISOString(),
  ...parti,
});

describe('a mani vuote non cambia niente', () => {
  it('senza effetti, senza indossati e senza esaurimento Kaelen è quello dei dati', () => {
    const a = kaelenAdesso(pg, s);
    expect(a.pg.caratteristiche).toEqual(pg.caratteristiche);
    expect(a.voci).toEqual({ ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 });
    expect(a.promemoria).toEqual([]);
  });

  it('lo stato appena nato non fa esplodere niente', () => {
    // Le isole montano prima che il segnale sia inizializzato: `stato.value`
    // parte da `{}`. Non è teoria — è come si rompe una pagina intera.
    expect(() => kaelenAdesso(pg, {} as StatoSessione)).not.toThrow();
  });
});

describe('un punteggio cambia sei numeri, e nessuno li ha riscritti', () => {
  it('la Forza a 20 si propaga a tutto ciò che dalla Forza dipende', () => {
    s = aggiungiOggetto(s, {
      nome: 'Cintura di Forza',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
    });
    s = commutaIndossato(s, 'mio:1');
    const a = kaelenAdesso(pg, s);

    expect(a.pg.caratteristiche.for).toBe(20);
    expect(modificatore(a.pg.caratteristiche.for)).toBe(5);
    expect(perColpire(a.pg, 'maglio-una-mano')).toBe(perColpire(pg, 'maglio-una-mano') + 2);
    expect(dannoTesto(a.pg, 'maglio-una-mano')).not.toBe(dannoTesto(pg, 'maglio-una-mano'));
    expect(bonusTiroSalvezza(a.pg, 'for')).toBe(bonusTiroSalvezza(pg, 'for') + 2);
    expect(bonusAbilita(a.pg, 'Atletica')).toBe(bonusAbilita(pg, 'Atletica') + 2);
    expect(capacitaTrasporto(a.pg)).toBe(600);
  });

  it('l’oggetto che non porti addosso non modifica niente', () => {
    s = aggiungiOggetto(s, {
      nome: 'Cintura di Forza',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
    });
    expect(kaelenAdesso(pg, s).pg.caratteristiche.for).toBe(pg.caratteristiche.for);
  });

  it('un punteggio più basso di quello di base non lo abbassa', () => {
    // «Il punteggio diventa X» vale se non è già più alto. Kaelen ha Saggezza
    // 16: una cintura da 15 non lo peggiora.
    s = accendiEffetto(
      s,
      effetto('Cianfrusaglia', [{ genere: 'punteggio', bersaglio: 'sag', valore: 15 }]),
    );
    expect(kaelenAdesso(pg, s).pg.caratteristiche.sag).toBe(pg.caratteristiche.sag);
  });

  it('la CD degli incantesimi segue la Saggezza senza che nessuno la ricalcoli', () => {
    s = accendiEffetto(
      s,
      effetto('Dono di Talos', [{ genere: 'punteggio', bersaglio: 'sag', valore: 20 }]),
    );
    expect(cdIncantesimi(kaelenAdesso(pg, s).pg)).toBe(cdIncantesimi(pg) + 2);
  });
});

describe('la trappola della CA', () => {
  it('la CA di base resta quella di pg.armatura, non la tocca nessuno', () => {
    // `pg.armatura` è l'unica sorgente della CA di base: cotta di maglia e
    // scudo ci sono già dentro, e compaiono *anche* in `equipaggiamento`. Un
    // oggetto indossato dichiara solo il **delta**.
    s = aggiungiOggetto(s, {
      nome: 'Scudo +1',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 1 }],
    });
    s = commutaIndossato(s, 'mio:1');
    const a = kaelenAdesso(pg, s);

    expect(classeArmatura(a.pg)).toBe(classeArmatura(pg));
    expect(classeArmatura(a.pg) + a.voci.ca).toBe(classeArmatura(pg) + 1);
  });

  it('uno scudo magico scritto come «CA 2» conterebbe due volte', () => {
    // Questa è la guardia che dichiara il vincolo. Il numero plausibile è
    // esattamente il problema: entrambe le strade producono una CA credibile,
    // e nessun altro test se ne accorgerebbe.
    const sbagliato = { genere: 'voce', bersaglio: 'ca', valore: 2 } as const;
    s = aggiungiOggetto(s, {
      nome: 'Scudo +1 dichiarato male',
      quantita: 1,
      consumabile: false,
      modifiche: [sbagliato],
    });
    s = commutaIndossato(s, 'mio:1');
    const a = kaelenAdesso(pg, s);
    // Con lo scudo già contato in `pg.armatura.scudo`, il totale sale di due
    // invece che di uno: 20 invece di 19.
    expect(classeArmatura(a.pg) + a.voci.ca).toBe(classeArmatura(pg) + 2);
  });

  it('Scudo della Fede e uno scudo magico si sommano, ed è corretto', () => {
    s = accendiEffetto(
      s,
      effetto('Scudo della Fede', [{ genere: 'voce', bersaglio: 'ca', valore: 2 }]),
    );
    s = aggiungiOggetto(s, {
      nome: 'Scudo +1',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 1 }],
    });
    s = commutaIndossato(s, 'mio:1');
    expect(kaelenAdesso(pg, s).voci.ca).toBe(3);
  });
});

describe('esaurimento', () => {
  it('un livello è −2 a ogni prova col d20 e −5 piedi', () => {
    expect(modificheEsaurimento(1)).toEqual([
      { genere: 'voce', bersaglio: 'prove', valore: -2 },
      { genere: 'voce', bersaglio: 'ts', valore: -2 },
      { genere: 'voce', bersaglio: 'colpire', valore: -2 },
      { genere: 'voce', bersaglio: 'velocita', valore: -5 },
    ]);
  });

  it('a zero non produce niente', () => {
    expect(modificheEsaurimento(0)).toEqual([]);
  });

  it('i livelli si moltiplicano e arrivano nelle voci', () => {
    s = impostaEsaurimento(s, 3);
    const a = kaelenAdesso(pg, s);
    expect(a.voci.prove).toBe(-6);
    expect(a.voci.ts).toBe(-6);
    expect(a.voci.colpire).toBe(-6);
    expect(a.voci.velocita).toBe(-15);
  });
});

describe('i promemoria', () => {
  it('raccoglie quel che non diventa un numero', () => {
    s = accendiEffetto(s, effetto('Benedizione', [], { promemoria: '+1d4 a colpire e ai TS' }));
    expect(kaelenAdesso(pg, s).promemoria).toEqual(['+1d4 a colpire e ai TS']);
  });

  it('un effetto senza promemoria non lascia una riga vuota', () => {
    s = accendiEffetto(
      s,
      effetto('Scudo della Fede', [{ genere: 'voce', bersaglio: 'ca', valore: 2 }]),
    );
    expect(kaelenAdesso(pg, s).promemoria).toEqual([]);
  });
});

describe('il riassunto delle voci che nessun portale riscrive', () => {
  it('a voci intonse non dice niente', () => {
    expect(riassuntoVoci({ ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 })).toBeNull();
  });

  it('la CA non entra: quella un portale la riscrive davvero', () => {
    expect(riassuntoVoci({ ca: 2, ts: 0, colpire: 0, prove: 0, velocita: 0 })).toBeNull();
  });

  it('dice in parole gli addendi che i numeri in pagina non portano', () => {
    expect(riassuntoVoci({ ca: 0, ts: -2, colpire: -2, prove: -2, velocita: -5 })).toBe(
      '−2 alle prove · −2 ai TS · −2 a colpire · −5 ft di velocità',
    );
  });

  it('usa il meno tipografico, non il trattino', () => {
    // «-2» col trattino da tastiera in mezzo ai numeri della scheda si legge
    // come una sillabazione.
    expect(riassuntoVoci({ ca: 0, ts: -1, colpire: 0, prove: 0, velocita: 0 })).toContain('−1');
  });

  it('un addendo positivo porta il più', () => {
    expect(riassuntoVoci({ ca: 0, ts: 1, colpire: 0, prove: 0, velocita: 0 })).toBe('+1 ai TS');
  });
});
