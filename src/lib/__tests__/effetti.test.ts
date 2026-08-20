import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale, type StatoSessione } from '@/lib/sheet-state';
import {
  accendiEffetto,
  impostaEsaurimento,
  nuovoIdEffetto,
  spegniEffetto,
  spegniTuttiGliEffetti,
  spentoDa,
  type Effetto,
} from '@/lib/effetti';

const pg = caricaPersonaggioDaFile();
let s: StatoSessione;

beforeEach(() => {
  s = statoIniziale(pg, 'v-test');
});

const effetto = (parti: Partial<Effetto>): Effetto => ({
  id: nuovoIdEffetto(),
  nome: 'Benedizione',
  durata: '1 minuto',
  concentrazione: false,
  modifiche: [],
  accesoIl: new Date().toISOString(),
  ...parti,
});

describe('accendere', () => {
  it('un effetto entra nella lista', () => {
    s = accendiEffetto(s, effetto({ nome: 'Scudo della Fede' }));
    expect(s.effetti.map((e) => e.nome)).toEqual(['Scudo della Fede']);
  });

  it('due effetti senza concentrazione convivono', () => {
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    expect(s.effetti).toHaveLength(2);
  });

  it('gli id sono diversi anche accendendo due volte di fila', () => {
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    s = accendiEffetto(s, effetto({ nome: 'Spaventato' }));
    expect(s.effetti[0].id).not.toBe(s.effetti[1].id);
  });
});

describe('la concentrazione è una sola', () => {
  it('accenderne una seconda spegne la prima', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    s = accendiEffetto(s, effetto({ nome: 'Silenzio', concentrazione: true }));
    expect(s.effetti.map((e) => e.nome)).toEqual(['Silenzio']);
  });

  it('non porta via gli effetti che non concentrano', () => {
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    s = accendiEffetto(s, effetto({ nome: 'Silenzio', concentrazione: true }));
    expect(s.effetti.map((e) => e.nome)).toEqual(['Santuario', 'Silenzio']);
  });

  it('«chi si spegne» si sa prima di accendere, non dopo', () => {
    // Una regola applicata di nascosto è indistinguibile da un errore: chi
    // accende deve poterlo dire *mentre* lo dice, non scoprirlo dopo.
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    expect(spentoDa(s, { concentrazione: true })?.nome).toBe('Benedizione');
    expect(spentoDa(s, { concentrazione: false })).toBeNull();
  });

  it('senza niente acceso non si spegne niente', () => {
    expect(spentoDa(s, { concentrazione: true })).toBeNull();
  });
});

describe('rilanciare lo stesso incantesimo rinnova, non accumula', () => {
  it('due lanci della stessa origine lasciano una voce sola', () => {
    s = accendiEffetto(s, effetto({ nome: 'Santuario', origine: 'santuario' }));
    s = accendiEffetto(s, effetto({ nome: 'Santuario', origine: 'santuario' }));
    expect(s.effetti).toHaveLength(1);
  });

  it('gli effetti senza origine non si fondono fra loro', () => {
    // Due dosi di veleno diverse restano due righe: nessuna delle due dice di
    // essere la stessa cosa dell'altra.
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    expect(s.effetti).toHaveLength(2);
  });
});

describe('spegnere', () => {
  it('per id', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione' }));
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    s = spegniEffetto(s, s.effetti[0].id);
    expect(s.effetti.map((e) => e.nome)).toEqual(['Santuario']);
  });

  it('un id che non c’è non cambia niente', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione' }));
    expect(spegniTuttiGliEffetti(spegniEffetto(s, 'eff:mai')).effetti).toEqual([]);
    expect(spegniEffetto(s, 'eff:mai').effetti).toHaveLength(1);
  });

  it('tutti insieme', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    expect(spegniTuttiGliEffetti(s).effetti).toEqual([]);
  });
});

describe('esaurimento', () => {
  it('sale e scende', () => {
    expect(impostaEsaurimento(s, 3).esaurimento).toBe(3);
  });

  it('non scende sotto zero né sale sopra sei', () => {
    // Il sesto livello è la morte: oltre non c'è niente da rappresentare.
    expect(impostaEsaurimento(s, -1).esaurimento).toBe(0);
    expect(impostaEsaurimento(s, 9).esaurimento).toBe(6);
  });

  it('non è un effetto e non finisce nella loro lista', () => {
    s = impostaEsaurimento(s, 2);
    expect(s.effetti).toEqual([]);
    expect(spegniTuttiGliEffetti(s).esaurimento).toBe(2);
  });
});
