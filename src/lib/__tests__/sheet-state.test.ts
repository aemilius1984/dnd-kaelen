import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import {
  SCHEMA_VERSION,
  SLOT_MANUALE,
  applicaCura,
  applicaDanno,
  carica,
  impostaPfTemporanei,
  puoPreparare,
  puoSpendereSlot,
  puoUsareRisorsa,
  recuperaSlot,
  riposoBreve,
  riposoLungo,
  segnaTsMorte,
  spendiDadoVitaConCura,
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
    expect(s.slotSpesi).toEqual({ 1: [], 2: [] });
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

  it('ignora un danno negativo: non genera PF temporanei dal nulla', () => {
    // Il campo "Quantità" del pannello azioni non impedisce un numero
    // negativo: applicaDanno deve scartarlo, non trasformarlo in cura.
    s = applicaDanno(s, -5);
    expect(s.pfTemporanei).toBe(0);
    expect(s.pf).toBe(21);
  });

  it('ignora una cura negativa: non riduce i PF', () => {
    s = applicaDanno(s, 5);
    s = applicaCura(s, pg, -3);
    expect(s.pf).toBe(16);
  });

  it('azzera i tiri salvezza contro morte quando risale sopra zero', () => {
    s = applicaDanno(s, 50);
    s = segnaTsMorte(s, 'fallimento');
    expect(s.tsMorte.fallimenti).toBe(1);
    s = applicaCura(s, pg, 1);
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });

  it('non supera tre tiri salvezza contro morte', () => {
    s = applicaDanno(s, 50);
    for (let i = 0; i < 4; i++) s = segnaTsMorte(s, 'fallimento');
    expect(s.tsMorte.fallimenti).toBe(3);
  });
});

describe('slot e risorse', () => {
  it('non spende più slot di quelli disponibili', () => {
    for (let i = 0; i < 6; i++) s = spendiSlot(s, pg, 1, 'comando');
    expect(s.slotSpesi[1]).toHaveLength(4);
  });

  it('non usa una risorsa oltre il massimo', () => {
    for (let i = 0; i < 5; i++) s = usaRisorsa(s, pg, 'incanalare');
    expect(s.risorseUsate['incanalare']).toBe(2);
  });

  it('puoSpendereSlot è vero lontano dal confine e falso al confine, in accordo con spendiSlot', () => {
    expect(puoSpendereSlot(s, pg, 1)).toBe(true);
    for (let i = 0; i < 4; i++) s = spendiSlot(s, pg, 1, 'comando');
    expect(s.slotSpesi[1]).toHaveLength(4);
    expect(puoSpendereSlot(s, pg, 1)).toBe(false);
    // Il predicato falso deve coincidere con un mutatore che non cambia
    // nulla: stesso riferimento in uscita, non solo lo stesso valore.
    expect(spendiSlot(s, pg, 1, 'comando')).toBe(s);
  });

  it('puoUsareRisorsa è vero lontano dal confine e falso al confine, in accordo con usaRisorsa', () => {
    expect(puoUsareRisorsa(s, pg, 'incanalare')).toBe(true);
    for (let i = 0; i < 2; i++) s = usaRisorsa(s, pg, 'incanalare');
    expect(s.risorseUsate['incanalare']).toBe(2);
    expect(puoUsareRisorsa(s, pg, 'incanalare')).toBe(false);
    expect(usaRisorsa(s, pg, 'incanalare')).toBe(s);
  });
});

describe('riposi', () => {
  it('il riposo breve recupera un uso di Incanalare Divinità e lascia il resto', () => {
    s = usaRisorsa(s, pg, 'incanalare');
    s = usaRisorsa(s, pg, 'incanalare');
    s = usaRisorsa(s, pg, 'ira-tempesta');
    s = spendiSlot(s, pg, 1, 'comando');
    s = applicaDanno(s, 5);
    s = riposoBreve(s, pg);
    expect(s.risorseUsate['incanalare']).toBe(1);
    expect(s.risorseUsate['ira-tempesta']).toBe(1);
    expect(s.slotSpesi[1]).toEqual(['comando']);
    expect(s.pf).toBe(16);
  });

  it('il riposo lungo ripristina tutto e recupera metà dei dadi vita', () => {
    s = applicaDanno(s, 10);
    s = impostaPfTemporanei(s, 4);
    s = spendiSlot(s, pg, 2, 'frantumare');
    s = usaRisorsa(s, pg, 'ira-tempesta');
    s = spendiDadoVitaConCura(s, pg, 1);
    s = spendiDadoVitaConCura(s, pg, 1);
    s = spendiDadoVitaConCura(s, pg, 1);
    s = riposoLungo(s, pg);
    expect(s.pf).toBe(21);
    expect(s.pfTemporanei).toBe(0);
    expect(s.slotSpesi).toEqual({ 1: [], 2: [] });
    expect(s.risorseUsate['ira-tempesta']).toBe(0);
    expect(s.dadiVitaSpesi).toBe(2);
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });
});

describe('incantesimi preparati', () => {
  it('non supera il limite di sei', () => {
    // Slug arbitrario, né in pg.dominio né in pg.trucchetti: a bloccarlo deve
    // essere il limite di lunghezza, non la guardia su dominio/trucchetti.
    s = togglePreparato(s, pg, 'incantesimo-di-prova');
    expect(s.preparati).toHaveLength(6);
    expect(s.preparati).not.toContain('incantesimo-di-prova');
  });

  it('aggiunge uno slug qualunque una volta liberato uno slot', () => {
    // Dimostra che il test sopra colpisce davvero il ramo del limite: con la
    // lista a 5 lo stesso slug arbitrario viene accettato.
    s = togglePreparato(s, pg, 'comando');
    s = togglePreparato(s, pg, 'incantesimo-di-prova');
    expect(s.preparati).toContain('incantesimo-di-prova');
    expect(s.preparati).toHaveLength(6);
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

  it('rimuove uno slug del dominio se già presente in uno stato salvato in precedenza', () => {
    // Simula uno stato salvato prima del fix della guardia, dove uno slug di
    // dominio era finito in `preparati`: la rimozione deve restare possibile
    // per permettere all'utente di ripulirlo.
    const statoVecchio = { ...s, preparati: [...s.preparati.slice(0, 5), 'frantumare'] };
    const risultato = togglePreparato(statoVecchio, pg, 'frantumare');
    expect(risultato.preparati).not.toContain('frantumare');
    expect(risultato.preparati).toHaveLength(5);
  });

  it('puoPreparare è vero lontano dal confine e falso al confine, in accordo con togglePreparato', () => {
    s = togglePreparato(s, pg, 'comando');
    expect(s.preparati).toHaveLength(5);
    expect(puoPreparare(s, pg)).toBe(true);
    s = togglePreparato(s, pg, 'comando');
    expect(s.preparati).toHaveLength(6);
    expect(puoPreparare(s, pg)).toBe(false);
    // Il predicato falso deve coincidere con un mutatore che non aggiunge
    // nulla: stesso riferimento in uscita per uno slug nuovo, non solo lo
    // stesso valore.
    expect(togglePreparato(s, pg, 'incantesimo-di-prova')).toBe(s);
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
    const daJsonRotto = carica('non-json', pg, VERSIONE);
    expect(daJsonRotto.stato.pf).toBe(21);
    expect(daJsonRotto.azzerato).toBe(true);
    expect(carica(null, pg, VERSIONE).azzerato).toBe(false);
  });
});

describe('hash dei dati', () => {
  it('è stabile e cambia quando cambiano i dati', () => {
    expect(hashDati('kaelen')).toBe(hashDati('kaelen'));
    expect(hashDati('kaelen')).not.toBe(hashDati('kaelen '));
  });
});

describe('dadi vita spesi durante il riposo breve', () => {
  it('spende un dado e cura del totale tirato al tavolo', () => {
    const pg = caricaPersonaggioDaFile();
    const s = applicaDanno(statoIniziale(pg, 'v'), 10);
    const dopo = spendiDadoVitaConCura(s, pg, 6);
    expect(dopo.dadiVitaSpesi).toBe(1);
    expect(dopo.pf).toBe(s.pf + 6);
  });

  it('cura almeno 1 PF anche con un totale minore', () => {
    const pg = caricaPersonaggioDaFile();
    const s = applicaDanno(statoIniziale(pg, 'v'), 10);
    expect(spendiDadoVitaConCura(s, pg, 0).pf).toBe(s.pf + 1);
    expect(spendiDadoVitaConCura(s, pg, -3).pf).toBe(s.pf + 1);
  });

  it('non supera i punti ferita massimi', () => {
    const pg = caricaPersonaggioDaFile();
    const s = applicaDanno(statoIniziale(pg, 'v'), 2);
    expect(spendiDadoVitaConCura(s, pg, 9).pf).toBe(pg.pfMax);
  });

  it('non fa nulla se non restano dadi vita', () => {
    const pg = caricaPersonaggioDaFile();
    let s = applicaDanno(statoIniziale(pg, 'v'), 10);
    for (let i = 0; i < pg.numeroDadiVita; i++) s = spendiDadoVitaConCura(s, pg, 4);
    // Convenzione del file per i mutatori bloccati: stesso riferimento in
    // uscita, non solo lo stesso valore — vedi la riga 108-109 sopra.
    expect(spendiDadoVitaConCura(s, pg, 4)).toBe(s);
  });
});

describe('slot che ricordano cosa hanno bruciato', () => {
  it('accoda lo slug di chi ha speso lo slot', () => {
    expect(spendiSlot(s, pg, 1, 'cura-ferite').slotSpesi[1]).toEqual(['cura-ferite']);
  });

  it('la spesa manuale dal pannello scrive una costante che nessuno slug può essere', () => {
    expect(spendiSlot(s, pg, 1, SLOT_MANUALE).slotSpesi[1]).toEqual([SLOT_MANUALE]);
    // Gli slug vengono dai nomi dei file in content/spells/: un carattere che
    // un nome di file non può contenere non può collidere.
    expect(SLOT_MANUALE).toContain(':');
    for (const slug of [...pg.trucchetti, ...pg.dominio, ...pg.preparatiIniziali]) {
      expect(slug).not.toBe(SLOT_MANUALE);
    }
  });

  it('recuperare toglie l’ultimo, che è ciò che «Annulla» promette', () => {
    s = spendiSlot(s, pg, 1, 'benedizione');
    s = spendiSlot(s, pg, 1, 'comando');

    expect(recuperaSlot(s, 1).slotSpesi[1]).toEqual(['benedizione']);
  });

  it('il riposo lungo svuota le liste, non le azzera a numero', () => {
    s = riposoLungo(spendiSlot(s, pg, 1, 'comando'), pg);

    for (const x of pg.slot) expect(s.slotSpesi[x.livello]).toEqual([]);
  });

  it('recuperare uno slot mai speso non inventa una lista storta', () => {
    expect(recuperaSlot(s, 2).slotSpesi[2]).toEqual([]);
  });
});
