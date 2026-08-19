import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import {
  SCHEMA_VERSION,
  SPESA_MANUALE,
  applicaCura,
  applicaDanno,
  carica,
  impostaIspirazione,
  impostaPfTemporanei,
  impostaPreparati,
  puoSpendereSlot,
  puoUsareRisorsa,
  recuperaRisorsa,
  recuperaSlot,
  riposoBreve,
  riposoLungo,
  segnaTsMorte,
  spendiDadoVitaConCura,
  spendiSlot,
  statoIniziale,
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
    expect(s.risorseUsate).toEqual({ incanalare: [], 'ira-tempesta': [], 'tuono-tempesta': [] });
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
    s = applicaDanno(s, pg, 5);
    expect(s.pfTemporanei).toBe(0);
    expect(s.pf).toBe(19);
  });

  it('non scende sotto zero', () => {
    s = applicaDanno(s, pg, pg.pfMax);
    expect(s.pf).toBe(0);
  });

  it('non cura oltre il massimo', () => {
    s = applicaDanno(s, pg, 5);
    s = applicaCura(s, pg, 100);
    expect(s.pf).toBe(21);
  });

  it('ignora un danno negativo: non genera PF temporanei dal nulla', () => {
    // Il campo "Quantità" del pannello azioni non impedisce un numero
    // negativo: applicaDanno deve scartarlo, non trasformarlo in cura.
    s = applicaDanno(s, pg, -5);
    expect(s.pfTemporanei).toBe(0);
    expect(s.pf).toBe(21);
  });

  it('ignora una cura negativa: non riduce i PF', () => {
    s = applicaDanno(s, pg, 5);
    s = applicaCura(s, pg, -3);
    expect(s.pf).toBe(16);
  });

  it('azzera i tiri salvezza contro morte quando risale sopra zero', () => {
    s = applicaDanno(s, pg, pg.pfMax);
    s = segnaTsMorte(s, 'fallimento');
    expect(s.tsMorte.fallimenti).toBe(1);
    s = applicaCura(s, pg, 1);
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });

  it('il terzo fallimento non si accumula: uccide', () => {
    // Prima i contatori si fermavano a tre e lì restavano. Ora il terzo segno
    // è una transizione — `statoVitale` diventa `morto` e i contatori tornano
    // a zero — quindi per lato ne bastano due.
    s = applicaDanno(s, pg, pg.pfMax);
    for (let i = 0; i < 4; i++) s = segnaTsMorte(s, 'fallimento');
    expect(s.statoVitale).toBe('morto');
    expect(s.tsMorte.fallimenti).toBeLessThanOrEqual(2);
  });
});

describe('slot e risorse', () => {
  it('non spende più slot di quelli disponibili', () => {
    for (let i = 0; i < 6; i++) s = spendiSlot(s, pg, 1, 'comando');
    expect(s.slotSpesi[1]).toHaveLength(4);
  });

  it('non usa una risorsa oltre il massimo', () => {
    for (let i = 0; i < 5; i++) s = usaRisorsa(s, pg, 'incanalare');
    expect(s.risorseUsate['incanalare']).toHaveLength(2);
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
    expect(s.risorseUsate['incanalare']).toHaveLength(2);
    expect(puoUsareRisorsa(s, pg, 'incanalare')).toBe(false);
    expect(usaRisorsa(s, pg, 'incanalare')).toBe(s);
  });
});

describe('la coda delle risorse spese', () => {
  it('ricorda chi ha speso, in ordine, come già faceva per gli slot', () => {
    // Un conteggio non dice *cosa* è stato speso, e senza quello «Annulla»
    // non ha niente da togliere: toglierebbe un'unità anonima all'ultima
    // risorsa toccata, che non è la stessa cosa che disfare l'ultimo gesto.
    s = usaRisorsa(s, pg, 'incanalare', 'scintilla-divina');
    s = usaRisorsa(s, pg, 'incanalare', 'ira-distruttiva');

    expect(s.risorseUsate['incanalare']).toEqual(['scintilla-divina', 'ira-distruttiva']);
  });

  it('senza un colpevole scrive il segnaposto, non una stringa vuota', () => {
    // Il pannello azioni consuma senza sapere da cosa: è il caso d'angolo per
    // cui esiste. La casella si occupa lo stesso, e si vede che è manuale.
    s = usaRisorsa(s, pg, 'incanalare');

    expect(s.risorseUsate['incanalare']).toEqual([SPESA_MANUALE]);
  });

  it('recuperare toglie l’ultimo, non uno qualsiasi', () => {
    s = usaRisorsa(s, pg, 'incanalare', 'scintilla-divina');
    s = usaRisorsa(s, pg, 'incanalare', 'ira-distruttiva');
    s = recuperaRisorsa(s, 'incanalare');

    expect(s.risorseUsate['incanalare']).toEqual(['scintilla-divina']);
  });
});

describe('riposi', () => {
  it('il riposo breve recupera un uso di Incanalare Divinità e lascia il resto', () => {
    s = usaRisorsa(s, pg, 'incanalare');
    s = usaRisorsa(s, pg, 'incanalare');
    s = usaRisorsa(s, pg, 'ira-tempesta');
    s = spendiSlot(s, pg, 1, 'comando');
    s = applicaDanno(s, pg, 5);
    s = riposoBreve(s, pg);
    expect(s.risorseUsate['incanalare']).toHaveLength(1);
    expect(s.risorseUsate['ira-tempesta']).toHaveLength(1);
    expect(s.slotSpesi[1]).toEqual(['comando']);
    expect(s.pf).toBe(16);
  });

  it('il riposo lungo ripristina tutto e recupera tutti i dadi vita', () => {
    s = applicaDanno(s, pg, 10);
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
    expect(s.risorseUsate['ira-tempesta']).toHaveLength(0);
    // Erano tre spesi e ne tornava uno solo: `Math.floor(3 / 2)` è la regola
    // dei *livelli*, non dei dadi vita. Il Riposo Lungo li rimette tutti.
    expect(s.dadiVitaSpesi).toBe(0);
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
    expect(s.statoVitale).toBe('cosciente');
  });

  it('nessuno dei due riposi parte da terra', () => {
    // Precondizione del manuale: un riposo valido richiede almeno 1 PF. A 0
    // PF si è incoscienti, e da incoscienti non si riposa — ci si stabilizza.
    const giu = applicaDanno(statoIniziale(pg, VERSIONE), pg, pg.pfMax);

    expect(riposoBreve(giu, pg)).toBe(giu);
    expect(riposoLungo(giu, pg)).toBe(giu);
  });
});

describe('i preparati entrano nello stato solo completi e legittimi', () => {
  const sei = () => [...pg.preparatiIniziali];

  it('accetta una lista di sei validi', () => {
    const altra = [...sei().slice(1), 'incantesimo-di-prova'];

    expect(impostaPreparati(s, pg, altra).preparati).toEqual(altra);
  });

  it('rifiuta una lista che non è esattamente di sei', () => {
    // Cinque o sette non sono stati che le regole ammettono: se una sessione
    // di preparazione interrotta riuscisse a salvarli, il personaggio
    // resterebbe fuori regola senza che nulla lo segnali.
    expect(impostaPreparati(s, pg, sei().slice(1))).toBe(s);
    expect(impostaPreparati(s, pg, [...sei(), 'incantesimo-di-prova'])).toBe(s);
  });

  it('rifiuta i duplicati', () => {
    const doppio = [...sei().slice(1), sei()[1]];

    expect(impostaPreparati(s, pg, doppio)).toBe(s);
  });

  it('rifiuta dominio e trucchetti, che sono già preparati', () => {
    expect(impostaPreparati(s, pg, [...sei().slice(1), pg.dominio[0]])).toBe(s);
    expect(impostaPreparati(s, pg, [...sei().slice(1), pg.trucchetti[0]])).toBe(s);
  });
});

describe('caricamento e versioning', () => {
  it('conserva lo stato quando la versione della scheda non è cambiata', () => {
    s = applicaDanno(s, pg, 7);
    const { stato, azzerato } = carica(JSON.stringify(s), pg, VERSIONE);
    expect(azzerato).toBe(false);
    expect(stato.pf).toBe(14);
  });

  it('azzera lo stato quando la scheda è stata ripubblicata', () => {
    s = applicaDanno(s, pg, 7);
    const { stato, azzerato } = carica(JSON.stringify(s), pg, 'altra-versione');
    expect(azzerato).toBe(true);
    expect(stato.pf).toBe(21);
  });

  it('azzera lo stato quando lo schema non è migrabile', () => {
    // Lo schema 2 adesso si migra — la prova sta più sotto. Questa guardia
    // vale per una versione che non sappiamo leggere: lì azzerare è l'unica
    // cosa onesta.
    const vecchio = JSON.stringify({ ...s, schemaVersion: 1 });
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
    const s = applicaDanno(statoIniziale(pg, 'v'), pg, 10);
    const dopo = spendiDadoVitaConCura(s, pg, 6);
    expect(dopo.dadiVitaSpesi).toBe(1);
    expect(dopo.pf).toBe(s.pf + 6);
  });

  it('cura almeno 1 PF anche con un totale minore', () => {
    const pg = caricaPersonaggioDaFile();
    const s = applicaDanno(statoIniziale(pg, 'v'), pg, 10);
    expect(spendiDadoVitaConCura(s, pg, 0).pf).toBe(s.pf + 1);
    expect(spendiDadoVitaConCura(s, pg, -3).pf).toBe(s.pf + 1);
  });

  it('non supera i punti ferita massimi', () => {
    const pg = caricaPersonaggioDaFile();
    const s = applicaDanno(statoIniziale(pg, 'v'), pg, 2);
    expect(spendiDadoVitaConCura(s, pg, 9).pf).toBe(pg.pfMax);
  });

  it('non fa nulla se non restano dadi vita', () => {
    const pg = caricaPersonaggioDaFile();
    let s = applicaDanno(statoIniziale(pg, 'v'), pg, 10);
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
    expect(spendiSlot(s, pg, 1, SPESA_MANUALE).slotSpesi[1]).toEqual([SPESA_MANUALE]);
    // Gli slug vengono dai nomi dei file in content/spells/: un carattere che
    // un nome di file non può contenere non può collidere.
    expect(SPESA_MANUALE).toContain(':');
    for (const slug of [...pg.trucchetti, ...pg.dominio, ...pg.preparatiIniziali]) {
      expect(slug).not.toBe(SPESA_MANUALE);
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

describe('Ispirazione Eroica', () => {
  it('nasce spenta e si accende e si spegne', () => {
    expect(s.ispirazione).toBe(false);
    expect(impostaIspirazione(s, true).ispirazione).toBe(true);
    expect(impostaIspirazione(impostaIspirazione(s, true), false).ispirazione).toBe(false);
  });

  it('il riposo lungo non la tocca', () => {
    // Non è una risorsa che si recupera: la dà il DM. Azzerarla al riposo
    // toglierebbe al giocatore qualcosa che nessuna regola gli toglie.
    expect(riposoLungo(impostaIspirazione(s, true), pg).ispirazione).toBe(true);
  });

  it('nemmeno il riposo breve', () => {
    expect(riposoBreve(impostaIspirazione(s, true), pg).ispirazione).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Lo stato a 0 PF, secondo docs/superpowers/specs/2026-08-18-regole-kaelen-chierico.md
// ─────────────────────────────────────────────────────────────────────────

describe('la macchina a stati della vitalità', () => {
  const vivo = () => statoIniziale(pg, 'v');

  it('si comincia coscienti', () => {
    expect(vivo().statoVitale).toBe('cosciente');
  });

  it('il danno che porta a zero rende incoscienti e apre i TS', () => {
    const s = applicaDanno(vivo(), pg, pg.pfMax);

    expect(s.pf).toBe(0);
    expect(s.statoVitale).toBe('incosciente');
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });

  it('un colpo il cui residuo oltre lo zero arriva ai PF massimi uccide sul posto', () => {
    // Morte istantanea: non si passa dai tiri salvezza.
    const s = applicaDanno(vivo(), pg, pg.pfMax * 2);

    expect(s.statoVitale).toBe('morto');
  });

  it('e un colpo che arriva a zero senza quel residuo no', () => {
    const s = applicaDanno(vivo(), pg, pg.pfMax + (pg.pfMax - 1));

    expect(s.statoVitale).toBe('incosciente');
  });

  it('il danno subito a terra vale un fallimento, il critico due', () => {
    const giu = applicaDanno(vivo(), pg, pg.pfMax);

    expect(applicaDanno(giu, pg, 3).tsMorte.fallimenti).toBe(1);
    expect(applicaDanno(giu, pg, 3, true).tsMorte.fallimenti).toBe(2);
  });

  it('chi è stabile e viene colpito torna incosciente con un fallimento', () => {
    let s = applicaDanno(vivo(), pg, pg.pfMax);
    for (let i = 0; i < 3; i++) s = segnaTsMorte(s, 'successo');
    expect(s.statoVitale).toBe('stabile');

    s = applicaDanno(s, pg, 2);

    expect(s.statoVitale).toBe('incosciente');
    expect(s.tsMorte.fallimenti).toBe(1);
  });

  it('tre successi rendono stabili e azzerano i contatori', () => {
    let s = applicaDanno(vivo(), pg, pg.pfMax);
    for (let i = 0; i < 3; i++) s = segnaTsMorte(s, 'successo');

    expect(s.statoVitale).toBe('stabile');
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });

  it('tre fallimenti uccidono', () => {
    let s = applicaDanno(vivo(), pg, pg.pfMax);
    for (let i = 0; i < 3; i++) s = segnaTsMorte(s, 'fallimento');

    expect(s.statoVitale).toBe('morto');
  });

  it('una cura che riporta sopra zero rimette coscienti e azzera i contatori', () => {
    let s = applicaDanno(vivo(), pg, pg.pfMax);
    s = segnaTsMorte(s, 'fallimento');

    s = applicaCura(s, pg, 4);

    expect(s.statoVitale).toBe('cosciente');
    expect(s.tsMorte).toEqual({ successi: 0, fallimenti: 0 });
  });

  it('a zero PF non si spendono dadi vita', () => {
    // Il Riposo Breve richiede almeno 1 PF: da terra non ci si cura da soli.
    const giu = applicaDanno(vivo(), pg, pg.pfMax);

    expect(spendiDadoVitaConCura(giu, pg, 5)).toBe(giu);
  });
});

describe('la migrazione dallo schema 3', () => {
  const v3 = (risorseUsate: Record<string, number>) =>
    JSON.stringify({ ...statoIniziale(pg, 'v'), schemaVersion: 3, risorseUsate });

  it('conta quanto contava prima, senza sapere chi aveva speso', () => {
    // Lo stato vecchio sapeva solo «due». Chi le ha spese non è ricostruibile
    // e non si inventa: entrano due segnaposto, e le caselle restano piene
    // come il giocatore le ha lasciate.
    const { stato, azzerato } = carica(v3({ incanalare: 2, 'ira-tempesta': 0 }), pg, 'v');

    expect(azzerato).toBe(false);
    expect(stato.risorseUsate['incanalare']).toEqual([SPESA_MANUALE, SPESA_MANUALE]);
    expect(stato.risorseUsate['ira-tempesta']).toEqual([]);
    expect(stato.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('non lascia indietro una risorsa che lo stato vecchio non nominava', () => {
    // Una risorsa aggiunta ai dati dopo l'ultimo salvataggio non c'è nella
    // mappa vecchia: senza una casella sua, `Contatori` leggerebbe undefined.
    const { stato } = carica(v3({ incanalare: 1 }), pg, 'v');

    for (const r of pg.risorse) expect(Array.isArray(stato.risorseUsate[r.id])).toBe(true);
  });
});

describe('la migrazione dallo schema 2', () => {
  const v2 = (extra: Record<string, unknown>) =>
    JSON.stringify({ ...statoIniziale(pg, 'v'), schemaVersion: 2, ...extra });

  it('una sessione sana non si perde: si migra', () => {
    // «Migrare ciò che è inequivocabile e azzerare soltanto quando la
    // migrazione non è sicura» — se aggiungere un campo cancellasse la
    // sessione, a metà campagna si perderebbero PF, slot e note.
    const { stato, azzerato } = carica(v2({ pf: 12, note: 'la nave' }), pg, 'v');

    expect(azzerato).toBe(false);
    expect(stato.pf).toBe(12);
    expect(stato.note).toBe('la nave');
    expect(stato.schemaVersion).toBe(SCHEMA_VERSION);
    expect(stato.statoVitale).toBe('cosciente');
  });

  it('a zero PF deduce lo stato dai contatori vecchi', () => {
    expect(carica(v2({ pf: 0 }), pg, 'v').stato.statoVitale).toBe('incosciente');
    expect(
      carica(v2({ pf: 0, tsMorte: { successi: 3, fallimenti: 0 } }), pg, 'v').stato.statoVitale,
    ).toBe('stabile');
    expect(
      carica(v2({ pf: 0, tsMorte: { successi: 0, fallimenti: 3 } }), pg, 'v').stato.statoVitale,
    ).toBe('morto');
  });

  it('ma una scheda cambiata azzera lo stesso', () => {
    // La migrazione riguarda la forma dello stato, non i dati del personaggio:
    // se cambia `sheetVersion` i numeri salvati non valgono più.
    expect(carica(v2({ pf: 12 }), pg, 'altra').azzerato).toBe(true);
  });
});
