import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { conseguenzaRiposo, riposoInutile } from '@/lib/riposi';
import {
  applicaDanno,
  spendiDadoVitaConCura,
  spendiSlot,
  statoIniziale,
  usaRisorsa,
} from '@/lib/sheet-state';

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
