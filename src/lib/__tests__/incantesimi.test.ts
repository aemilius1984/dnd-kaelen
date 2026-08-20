import { describe, expect, it } from 'vitest';
import { caricaIncantesimi, caricaPersonaggioDaFile } from '@/lib/carica-personaggio';

const pg = caricaPersonaggioDaFile();
const magie = caricaIncantesimi();

describe('collezione degli incantesimi', () => {
  it('contiene ogni slug citato nella scheda', () => {
    const citati = [...pg.trucchetti, ...pg.preparatiIniziali, ...pg.dominio];
    for (const slug of citati) {
      expect(magie.has(slug), `manca ${slug}`).toBe(true);
    }
  });

  it('marca come dominio esattamente i quattro incantesimi del dominio', () => {
    const dominio = [...magie.values()].filter((m) => m.dominio).length;
    expect(dominio).toBe(4);
  });

  it('assegna livello 0 ai tre trucchetti', () => {
    for (const slug of pg.trucchetti) {
      expect(magie.get(slug)?.livello).toBe(0);
    }
  });

  it('descrive Frantumare con i suoi dati operativi', () => {
    const frantumare = magie.get('frantumare');
    expect(frantumare?.nomeEn).toBe('Shatter');
    expect(frantumare?.livello).toBe(2);
    expect(frantumare?.tiro).toBe('Cos');
    expect(frantumare?.danno).toBe('3d8 tuono');
  });

  it('copre tutto il pool selezionabile di livello 1 e 2', () => {
    const perLivello = (n: number) =>
      [...magie.values()].filter((m) => m.livello === n && !m.dominio).length;
    expect(perLivello(1)).toBeGreaterThanOrEqual(15);
    expect(perLivello(2)).toBeGreaterThanOrEqual(12);
  });

  it('dichiara i campi obbligatori per ogni incantesimo', () => {
    for (const [slug, m] of magie) {
      expect(m.nome.length, slug).toBeGreaterThan(0);
      expect(m.nomeEn.length, slug).toBeGreaterThan(0);
      expect(m.gittata.length, slug).toBeGreaterThan(0);
      expect(m.tag.length, slug).toBeGreaterThan(0);
    }
  });
});

describe('tag rituale', () => {
  // L'elenco viene dalla tabella «CLERIC SPELL LIST» del PHB 2024, colonna
  // Special, dove `R` significa Ritual: livello 1 righe Detect Magic (C,R),
  // Detect Poison and Disease (C,R) e Purify Food and Drink (R); livello 2
  // righe Augury (R,M), Gentle Repose (R,M) e Silence (C,R). Individuazione
  // del Male e del Bene, Individuare Trappole e Localizzare Oggetto sono
  // stati controllati e NON sono rituali.
  const ATTESI = [
    'Individuazione del Magico',
    'Individuazione di Veleni e Malattie',
    'Presagio',
    'Purificare Cibo e Bevande',
    'Riposo Tranquillo',
    'Silenzio',
  ];

  it('marca come rituali solo incantesimi verificati sul manuale', () => {
    const rituali = [...magie.values()]
      .filter((m) => m.rituale)
      .map((m) => m.nome)
      .sort((a, b) => a.localeCompare(b, 'it'));

    expect(rituali).toEqual(ATTESI);
  });

  it('nessun trucchetto è rituale', () => {
    for (const m of magie.values()) if (m.livello === 0) expect(m.rituale).toBe(false);
  });

  it('ogni incantesimo dichiara il campo, anche chi non è rituale', () => {
    // `undefined` e `false` si comportano uguale in un `if`, ma solo il
    // secondo dice «controllato, non è un rituale».
    for (const m of magie.values()) expect(typeof m.rituale).toBe('boolean');
  });
});

describe('cosa resta addosso dopo il lancio', () => {
  const incantesimi = caricaIncantesimi();

  it('ogni incantesimo con concentrazione dichiara un effetto', () => {
    // È la ragione per cui la striscia esiste: lo slot di concentrazione è di
    // Kaelen qualunque sia il bersaglio. Un incantesimo che concentra e non ha
    // un effetto da accendere è un buco nella regola.
    const senza = [...incantesimi.entries()]
      .filter(([, m]) => m.concentrazione && !m.effetto)
      .map(([slug]) => slug);
    expect(senza).toEqual([]);
  });

  it('nessun incantesimo istantaneo lascia qualcosa acceso', () => {
    const assurdi = [...incantesimi.entries()]
      .filter(([, m]) => m.durata === 'Istantanea' && m.effetto)
      .map(([slug]) => slug);
    expect(assurdi).toEqual([]);
  });

  it('i tre senza concentrazione che durano sono dichiarati', () => {
    for (const slug of ['santuario', 'legame-protettivo', 'protezione-dai-veleni']) {
      expect(incantesimi.get(slug)?.effetto).toBeDefined();
    }
  });

  it('Scudo della Fede è l’unico che sposta un numero', () => {
    const conModifiche = [...incantesimi.entries()]
      .filter(([, m]) => (m.effetto?.modifiche.length ?? 0) > 0)
      .map(([slug]) => slug);
    expect(conModifiche).toEqual(['scudo-della-fede']);
    expect(incantesimi.get('scudo-della-fede')!.effetto!.modifiche).toEqual([
      { genere: 'voce', bersaglio: 'ca', valore: 2 },
    ]);
  });

  it('Benedizione non sposta nessun numero: dà un dado', () => {
    // Un dado non è un addendo. Sta nella striscia col suo promemoria e non
    // tocca niente.
    const benedizione = incantesimi.get('benedizione')!;
    expect(benedizione.effetto!.modifiche).toEqual([]);
    expect(benedizione.effetto!.promemoria).toContain('1d4');
  });

  it('Aiuto resta fuori: i PF massimi sono un altro giro', () => {
    expect(incantesimi.get('aiuto')?.effetto).toBeUndefined();
  });

  it('ogni effetto dichiarato dice almeno una delle due cose', () => {
    // Un effetto senza promemoria e senza modifiche è un chip che non dice
    // niente: occupa una riga in cima alla scheda per non ricordare nulla.
    for (const [slug, m] of incantesimi) {
      if (!m.effetto) continue;
      const dice = Boolean(m.effetto.promemoria) || m.effetto.modifiche.length > 0;
      expect(dice, `${slug} ha un effetto muto`).toBe(true);
    }
  });
});
