import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import {
  attaccoIncantesimi,
  bonusAbilita,
  bonusTiroSalvezza,
  capacitaTrasporto,
  cdIncantesimi,
  classeArmatura,
  dannoTesto,
  iniziativa,
  modificatore,
  perColpire,
  percezionePassiva,
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
  it('la CD per afferrare/spingere nella nota del colpo senz’armi corrisponde alla CD calcolata', () => {
    const cd = 8 + pg.competenza + modificatore(pg.caratteristiche.for);
    const nota = pg.attacchi.find((a) => a.id === 'colpo-senzarmi')?.note;
    expect(nota).toContain(`CD ${cd}`);
  });

  it('la CA senza scudo citata nella nota del maglio a due mani corrisponde alla CA calcolata', () => {
    const caSenzaScudo = classeArmatura(pg, false);
    const nota = pg.attacchi.find((a) => a.id === 'maglio-due-mani')?.note;
    expect(nota).toContain(`CA scende a ${caSenzaScudo}`);
  });

  it('il dado di Scintilla Divina nelle capacità corrisponde al modificatore di Saggezza calcolato', () => {
    const dado = `1d8 + ${modificatore(pg.caratteristiche.sag)}`;
    const scintillaDivina = pg.capacita.find(
      (c) => c.titolo === 'Incanalare Divinità: Scintilla Divina',
    );
    expect(scintillaDivina).toBeDefined();
    for (const paragrafo of scintillaDivina?.paragrafi ?? []) {
      expect(paragrafo).toContain(dado);
    }
  });
});
