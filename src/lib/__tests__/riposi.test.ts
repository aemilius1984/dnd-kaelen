import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { conseguenzaRiposo, riposoInutile } from '@/lib/riposi';
import {
  applicaDanno,
  riposoBreve,
  riposoLungo,
  spendiDadoVitaConCura,
  spendiSlot,
  statoIniziale,
  usaRisorsa,
  type StatoSessione,
} from '@/lib/sheet-state';
import { accendiEffetto, impostaEsaurimento, nuovoIdEffetto } from '@/lib/effetti';
import { aggiungiOggetto, commutaIndossato } from '@/lib/oggetti';

const pg = caricaPersonaggioDaFile();
let s = statoIniziale(pg, 'v-test');

beforeEach(() => {
  s = statoIniziale(pg, 'v-test');
});

describe('cosa cambia a riposare', () => {
  it('a sessione intatta non cambia niente, e lo dice', () => {
    // Il `confirm()` di prima elencava il manuale: un giocatore a PF pieni e
    // con tutti gli slot leggeva lo stesso avviso di uno ridotto a tre PF.
    expect(conseguenzaRiposo(s, pg, 'lungo')).toEqual([]);
    expect(riposoInutile(s, pg, 'lungo')).toBe(true);
    expect(riposoInutile(s, pg, 'breve')).toBe(true);
  });

  it('il riposo lungo conta quel che è stato speso davvero', () => {
    s = applicaDanno(s, pg, 5);
    s = spendiSlot(s, pg, 1, 'comando');
    s = spendiSlot(s, pg, 1, 'cura-ferite');
    s = spendiDadoVitaConCura(s, pg, 4);
    s = usaRisorsa(s, pg, 'incanalare', 'scintilla-divina');

    const righe = conseguenzaRiposo(s, pg, 'lungo');

    expect(righe[0]).toMatch(/^PF \d+ → 21$/);
    expect(righe).toContain('2 slot');
    expect(righe).toContain('1 carica');
    // Singolare: «1 dadi vita» è la sciatteria che si nota al primo sguardo.
    expect(righe).toContain('1 dado vita');
  });

  it('il riposo breve parla per risorsa, non in totale', () => {
    // Rende una carica per risorsa, non tutte: con due risorse a recupero
    // breve «2 cariche» si leggerebbe come due della stessa.
    s = usaRisorsa(s, pg, 'incanalare', 'scintilla-divina');
    s = usaRisorsa(s, pg, 'incanalare', 'ira-distruttiva');

    expect(conseguenzaRiposo(s, pg, 'breve')).toEqual(['Incanalare Divinità 0/2 → 1/2']);
  });

  it('il riposo breve ignora quel che recupera solo col lungo', () => {
    s = usaRisorsa(s, pg, 'ira-tempesta');

    expect(conseguenzaRiposo(s, pg, 'breve')).toEqual([]);
    expect(conseguenzaRiposo(s, pg, 'lungo')).toContain('1 carica');
  });
});

describe('i riposi e quel che è acceso', () => {
  const acceso = (s: StatoSessione, nome: string, concentrazione = false) =>
    accendiEffetto(s, {
      id: nuovoIdEffetto(),
      nome,
      durata: '10 minuti',
      concentrazione,
      modifiche: [],
      accesoIl: new Date().toISOString(),
    });

  it('il riposo breve spegne tutti gli effetti', () => {
    // Non è una semplificazione: un riposo breve dura un'ora, e l'effetto più
    // lungo che Kaelen sa produrre ne dura dieci minuti.
    const s = acceso(acceso(statoIniziale(pg, 'v'), 'Benedizione', true), 'Santuario');
    expect(riposoBreve(s, pg).effetti).toEqual([]);
  });

  it('il riposo lungo li spegne allo stesso modo', () => {
    const s = acceso(statoIniziale(pg, 'v'), 'Benedizione', true);
    expect(riposoLungo(s, pg).effetti).toEqual([]);
  });

  it('il riposo breve non tocca l’esaurimento', () => {
    const s = impostaEsaurimento(statoIniziale(pg, 'v'), 2);
    expect(riposoBreve(s, pg).esaurimento).toBe(2);
  });

  it('il riposo lungo ne toglie uno solo', () => {
    const s = impostaEsaurimento(statoIniziale(pg, 'v'), 3);
    expect(riposoLungo(s, pg).esaurimento).toBe(2);
  });

  it('a zero il riposo lungo non scende sotto', () => {
    expect(riposoLungo(statoIniziale(pg, 'v'), pg).esaurimento).toBe(0);
  });

  it('gli oggetti aggiunti e gli indossati non sono temporanei: i riposi non li guardano', () => {
    let s = aggiungiOggetto(statoIniziale(pg, 'v'), {
      nome: 'Cintura di Forza',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
    });
    s = commutaIndossato(s, 'mio:1');
    const dopo = riposoLungo(s, pg);
    expect(dopo.oggettiAggiunti).toHaveLength(1);
    expect(dopo.indossati).toEqual(['mio:1']);
  });
});

describe('cosa dice il riposo prima di premere', () => {
  it('conta gli effetti che si stanno per spegnere', () => {
    let s = statoIniziale(pg, 'v');
    s = accendiEffetto(s, {
      id: nuovoIdEffetto(),
      nome: 'Benedizione',
      durata: '1 minuto',
      concentrazione: true,
      modifiche: [],
      accesoIl: new Date().toISOString(),
    });
    expect(conseguenzaRiposo(s, pg, 'breve')).toContain('1 effetto attivo');
    expect(conseguenzaRiposo(s, pg, 'lungo')).toContain('1 effetto attivo');
  });

  it('al plurale dice «effetti attivi»', () => {
    let s = statoIniziale(pg, 'v');
    for (const nome of ['Avvelenato', 'Spaventato']) {
      s = accendiEffetto(s, {
        id: nuovoIdEffetto(),
        nome,
        durata: '1 minuto',
        concentrazione: false,
        modifiche: [],
        accesoIl: new Date().toISOString(),
      });
    }
    expect(conseguenzaRiposo(s, pg, 'breve')).toContain('2 effetti attivi');
  });

  it('il riposo lungo annuncia il livello di esaurimento che se ne va', () => {
    const s = impostaEsaurimento(statoIniziale(pg, 'v'), 2);
    expect(conseguenzaRiposo(s, pg, 'lungo')).toContain('Esaurimento 2 → 1');
    expect(conseguenzaRiposo(s, pg, 'breve')).not.toContain('Esaurimento 2 → 1');
  });

  it('un riposo breve con solo un effetto acceso non è più inutile', () => {
    // Prima diceva «niente da recuperare» e poi spegneva Benedizione: il
    // consenso informato al contrario.
    let s = statoIniziale(pg, 'v');
    s = accendiEffetto(s, {
      id: nuovoIdEffetto(),
      nome: 'Benedizione',
      durata: '1 minuto',
      concentrazione: true,
      modifiche: [],
      accesoIl: new Date().toISOString(),
    });
    expect(riposoInutile(s, pg, 'breve')).toBe(false);
  });
});
