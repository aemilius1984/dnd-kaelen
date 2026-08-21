import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import {
  attaccoIncantesimi,
  bonusAbilita,
  bonusTiroSalvezza,
  capacitaTrasporto,
  cdContrasto,
  cdIncantesimi,
  classeArmatura,
  dannoTesto,
  iniziativa,
  modificatore,
  perColpire,
  percezionePassiva,
  scomposizioneColpire,
  segno,
} from '@/lib/derive';

const pg = caricaPersonaggioDaFile();

describe('modificatori', () => {
  it('calcola il modificatore da un punteggio', () => {
    expect(modificatore(16)).toBe(3);
    expect(modificatore(13)).toBe(1);
    expect(modificatore(10)).toBe(0);
    expect(modificatore(8)).toBe(-1);
  });

  it('formatta i bonus con il segno', () => {
    expect(segno(5)).toBe('+5');
    expect(segno(0)).toBe('+0');
    expect(segno(-1)).toBe('-1');
  });
});

describe('valori derivati della scheda di Kaelen', () => {
  it('calcola i tiri salvezza, con competenza dove prevista', () => {
    expect(bonusTiroSalvezza(pg, 'sag')).toBe(5);
    expect(bonusTiroSalvezza(pg, 'car')).toBe(1);
    expect(bonusTiroSalvezza(pg, 'for')).toBe(3);
    expect(bonusTiroSalvezza(pg, 'des')).toBe(1);
    expect(bonusTiroSalvezza(pg, 'int')).toBe(0);
  });

  it('calcola i bonus delle abilità competenti', () => {
    expect(bonusAbilita(pg, 'Atletica')).toBe(5);
    expect(bonusAbilita(pg, 'Rapidità di mano')).toBe(3);
    expect(bonusAbilita(pg, 'Religione')).toBe(2);
    expect(bonusAbilita(pg, 'Percezione')).toBe(5);
  });

  it('calcola la classe armatura con e senza scudo', () => {
    expect(classeArmatura(pg)).toBe(18);
    expect(classeArmatura(pg, false)).toBe(16);
  });

  it('calcola CD e attacco con incantesimi', () => {
    expect(cdIncantesimi(pg)).toBe(13);
    expect(attaccoIncantesimi(pg)).toBe(5);
  });

  it('calcola per colpire e danno degli attacchi', () => {
    expect(perColpire(pg, 'maglio-una-mano')).toBe(5);
    expect(dannoTesto(pg, 'maglio-una-mano')).toBe('1d8 + 3');
    expect(dannoTesto(pg, 'maglio-due-mani')).toBe('1d10 + 3');
    expect(dannoTesto(pg, 'colpo-senzarmi')).toBe('4');
  });

  it('calcola percezione passiva, iniziativa e trasporto', () => {
    expect(percezionePassiva(pg)).toBe(15);
    expect(iniziativa(pg)).toBe(1);
    expect(capacitaTrasporto(pg)).toBe(480);
  });
});

// Guardie anti-deriva: kaelen.md contiene tre numeri scritti a mano dentro
// campi di prosa (leggibili al tavolo senza calcoli), ma quei numeri sono in
// realtà valori derivati. Questi test falliscono rumorosamente se cambia il
// personaggio (es. Forza sale a 18 al 4° livello) e la prosa non viene
// aggiornata di conseguenza.
describe('numeri scritti nella prosa', () => {
  // Queste due prima verificavano che i numeri *scritti a mano* nelle note
  // combaciassero con quelli calcolati. Adesso quei numeri nelle note non ci
  // sono più — la CD la deriva `cdContrasto`, la CA `classeArmatura` dal
  // booleano `scudo` — e la guardia giusta è più forte: che non tornino.
  it('nessuna prosa degli attacchi si scrive una CA o una CD a mano', () => {
    const prosa = pg.attacchi
      .flatMap((a) => [a.descrizione, a.note ?? '', ...a.avvertenze])
      .concat(pg.attacchi.flatMap((a) => a.alternative.flatMap((x) => [x.effetto, x.limite ?? ''])))
      .join(' ');

    expect(prosa).not.toMatch(/\bC[AD]\s*\d/i);
    expect(prosa).not.toMatch(/\bCA scende\b/i);
  });

  it('afferrare e spingere sono dati, non una nota', () => {
    // L'audit chiede che il colpo senz'armi distingua tre scelte. Finché
    // stavano dentro `note` come una frase, distinguerle era impossibile.
    const pugno = pg.attacchi.find((a) => a.id === 'colpo-senzarmi')!;

    expect(pugno.alternative.map((x) => x.nome)).toEqual(['Afferra', 'Spingi']);
    for (const x of pugno.alternative) expect(x.ts).toMatch(/Forza o Destrezza/);
  });

  it('il dado di Scintilla Divina nelle capacità corrisponde al modificatore di Saggezza calcolato', () => {
    const dado = `1d8 + ${modificatore(pg.caratteristiche.sag)}`;
    const scintillaDivina = pg.risorse
      .find((r) => r.id === 'incanalare')
      ?.usi?.find((u) => u.nome === 'Scintilla Divina');
    expect(scintillaDivina).toBeDefined();
    for (const paragrafo of scintillaDivina?.paragrafi ?? []) {
      expect(paragrafo).toContain(dado);
    }
  });
});

describe('scomposizione del tiro per colpire', () => {
  it('somma esattamente al totale, su ogni attacco', () => {
    // È l'unica proprietà che conta davvero: la card mostra le parti *e* il
    // totale, e se divergono il giocatore tira il numero sbagliato.
    for (const a of pg.attacchi) {
      const parti = scomposizioneColpire(pg, a.id);
      const somma = parti.reduce((t, p) => t + p.valore, 0);

      expect(somma).toBe(perColpire(pg, a.id));
    }
  });

  it('nomina la caratteristica e la competenza', () => {
    expect(scomposizioneColpire(pg, 'maglio-una-mano')).toEqual([
      { etichetta: 'FOR', valore: 3 },
      { etichetta: 'competenza', valore: 2 },
    ]);
  });

  it('tace sulla competenza quando non si è competenti', () => {
    const senza = {
      ...pg,
      attacchi: pg.attacchi.map((a) => ({ ...a, competente: false })),
    };

    expect(scomposizioneColpire(senza, 'maglio-una-mano')).toEqual([
      { etichetta: 'FOR', valore: 3 },
    ]);
  });
});

describe('la CD di afferrare e spingere', () => {
  it('è otto più competenza più Forza', () => {
    // 8 + 2 + 3 per Kaelen al livello 3.
    expect(cdContrasto(pg)).toBe(8 + pg.competenza + modificatore(pg.caratteristiche.for));
  });

  it('non è la CD degli incantesimi, anche quando il numero coincide', () => {
    // Oggi valgono tutt'e due 13, e da lì la tentazione di riusarne una sola.
    // Poggiano su caratteristiche diverse: al primo aumento di punteggio
    // divergono, e chi ha riusato la funzione se ne accorge al tavolo.
    const forzuto = {
      ...pg,
      caratteristiche: { ...pg.caratteristiche, for: pg.caratteristiche.for + 4 },
    };

    expect(cdContrasto(forzuto)).not.toBe(cdIncantesimi(forzuto));
  });
});
