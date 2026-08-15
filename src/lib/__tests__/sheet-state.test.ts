import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import {
  SCHEMA_VERSION,
  applicaCura,
  applicaDanno,
  carica,
  impostaPfTemporanei,
  riposoBreve,
  riposoLungo,
  segnaTsMorte,
  spendiDadoVita,
  spendiSlot,
  statoIniziale,
  togglePreparato,
  usaRisorsa,
  type StatoSessione,
} from '@/lib/sheet-state';
import { hashDati } from '@/lib/sheet-version';

const pg = caricaPersonaggioDaFile();
const VERSIONE = 'abc123';
let s: StatoSessione;

beforeEach(() => {
  s = statoIniziale(pg, VERSIONE);
});

describe('stato iniziale', () => {
  it('parte da PF massimi e risorse intatte', () => {
    expect(s.pf).toBe(21);
    expect(s.pfTemporanei).toBe(0);
    expect(s.dadiVitaSpesi).toBe(0);
    expect(s.slotSpesi).toEqual({ 1: 0, 2: 0 });
    expect(s.risorseUsate).toEqual({ incanalare: 0, 'ira-tempesta': 0, 'tuono-tempesta': 0 });
  });

  it('parte dai preparati dichiarati nella scheda', () => {
    expect(s.preparati).toEqual(pg.preparatiIniziali);
  });

  it("parte dalle quantità dell'equipaggiamento", () => {
    expect(s.oggetti['razioni']).toBe(7);
    expect(s.monete).toEqual({ mo: 16, ma: 8, mr: 0 });
  });
});

describe('punti ferita', () => {
  it('consuma prima i PF temporanei', () => {
    s = impostaPfTemporanei(s, 3);
    s = applicaDanno(s, 5);
    expect(s.pfTemporanei).toBe(0);
    expect(s.pf).toBe(19);
  });

  it('non scende sotto zero', () => {
    s = applicaDanno(s, 50);
    expect(s.pf).toBe(0);
  });

  it('non cura oltre il massimo', () => {
    s = applicaDanno(s, 5);
    s = applicaCura(s, pg, 100);
    expect(s.pf).toBe(21);
  });

  it('azzera i tiri salvezza contro morte quando risale sopra zero', () => {
    s = applicaDanno(s, 50);
    s = segnaTsMorte(s, 'fallimento');
    expect(s.tsMorte.fallimenti).toBe(1);
    s = applicaCura(s, pg, 1);
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });
});

describe('slot e risorse', () => {
  it('non spende più slot di quelli disponibili', () => {
    for (let i = 0; i < 6; i++) s = spendiSlot(s, pg, 1);
    expect(s.slotSpesi[1]).toBe(4);
  });

  it('non usa una risorsa oltre il massimo', () => {
    for (let i = 0; i < 5; i++) s = usaRisorsa(s, pg, 'incanalare');
    expect(s.risorseUsate['incanalare']).toBe(2);
  });

  it('non spende più dadi vita di quelli disponibili', () => {
    for (let i = 0; i < 5; i++) s = spendiDadoVita(s, pg);
    expect(s.dadiVitaSpesi).toBe(3);
  });
});

describe('riposi', () => {
  it('il riposo breve recupera un uso di Incanalare Divinità e lascia il resto', () => {
    s = usaRisorsa(s, pg, 'incanalare');
    s = usaRisorsa(s, pg, 'incanalare');
    s = usaRisorsa(s, pg, 'ira-tempesta');
    s = spendiSlot(s, pg, 1);
    s = applicaDanno(s, 5);
    s = riposoBreve(s, pg);
    expect(s.risorseUsate['incanalare']).toBe(1);
    expect(s.risorseUsate['ira-tempesta']).toBe(1);
    expect(s.slotSpesi[1]).toBe(1);
    expect(s.pf).toBe(16);
  });

  it('il riposo lungo ripristina tutto e recupera metà dei dadi vita', () => {
    s = applicaDanno(s, 10);
    s = impostaPfTemporanei(s, 4);
    s = spendiSlot(s, pg, 2);
    s = usaRisorsa(s, pg, 'ira-tempesta');
    s = spendiDadoVita(s, pg);
    s = spendiDadoVita(s, pg);
    s = spendiDadoVita(s, pg);
    s = riposoLungo(s, pg);
    expect(s.pf).toBe(21);
    expect(s.pfTemporanei).toBe(0);
    expect(s.slotSpesi).toEqual({ 1: 0, 2: 0 });
    expect(s.risorseUsate['ira-tempesta']).toBe(0);
    expect(s.dadiVitaSpesi).toBe(2);
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });
});

describe('incantesimi preparati', () => {
  it('non supera il limite di sei', () => {
    s = togglePreparato(s, pg, 'guida');
    expect(s.preparati).toHaveLength(6);
    expect(s.preparati).not.toContain('guida');
  });

  it('toglie e rimette un preparato', () => {
    s = togglePreparato(s, pg, 'comando');
    expect(s.preparati).not.toContain('comando');
    s = togglePreparato(s, pg, 'comando');
    expect(s.preparati).toContain('comando');
    expect(s.preparati).toHaveLength(6);
  });

  it('non aggiunge uno slug del dominio anche con la lista non piena', () => {
    s = togglePreparato(s, pg, 'comando');
    const attesi = s.preparati;
    s = togglePreparato(s, pg, 'frantumare');
    expect(s.preparati).toEqual(attesi);
    expect(s.preparati).toHaveLength(5);
  });

  it('non aggiunge un trucchetto anche con la lista non piena', () => {
    s = togglePreparato(s, pg, 'comando');
    const attesi = s.preparati;
    s = togglePreparato(s, pg, 'guida');
    expect(s.preparati).toEqual(attesi);
    expect(s.preparati).toHaveLength(5);
  });
});

describe('caricamento e versioning', () => {
  it('conserva lo stato quando la versione della scheda non è cambiata', () => {
    s = applicaDanno(s, 7);
    const { stato, azzerato } = carica(JSON.stringify(s), pg, VERSIONE);
    expect(azzerato).toBe(false);
    expect(stato.pf).toBe(14);
  });

  it('azzera lo stato quando la scheda è stata ripubblicata', () => {
    s = applicaDanno(s, 7);
    const { stato, azzerato } = carica(JSON.stringify(s), pg, 'altra-versione');
    expect(azzerato).toBe(true);
    expect(stato.pf).toBe(21);
  });

  it('azzera lo stato quando cambia lo schema', () => {
    const vecchio = JSON.stringify({ ...s, schemaVersion: SCHEMA_VERSION - 1 });
    expect(carica(vecchio, pg, VERSIONE).azzerato).toBe(true);
  });

  it('tratta uno stato illeggibile o assente come stato iniziale', () => {
    expect(carica('non-json', pg, VERSIONE).stato.pf).toBe(21);
    expect(carica(null, pg, VERSIONE).azzerato).toBe(false);
  });
});

describe('hash dei dati', () => {
  it('è stabile e cambia quando cambiano i dati', () => {
    expect(hashDati('kaelen')).toBe(hashDati('kaelen'));
    expect(hashDati('kaelen')).not.toBe(hashDati('kaelen '));
  });
});
