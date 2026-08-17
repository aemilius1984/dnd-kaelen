import type { Caratteristica, Personaggio } from './schema';

export function modificatore(punteggio: number): number {
  return Math.floor((punteggio - 10) / 2);
}

export function segno(n: number): string {
  return n < 0 ? `${n}` : `+${n}`;
}

function mod(pg: Personaggio, c: Caratteristica): number {
  return modificatore(pg.caratteristiche[c]);
}

export function bonusTiroSalvezza(pg: Personaggio, c: Caratteristica): number {
  return mod(pg, c) + (pg.tsCompetenti.includes(c) ? pg.competenza : 0);
}

export function bonusAbilita(pg: Personaggio, nomeAbilita: string): number {
  const voce = pg.abilita.find((a) => a.nome === nomeAbilita);
  if (!voce) throw new Error(`Abilità sconosciuta: ${nomeAbilita}`);
  return mod(pg, voce.caratteristica) + pg.competenza;
}

/** Le armature pesanti ignorano la Destrezza. Media: +2 al massimo. Leggera: intera. */
export function classeArmatura(pg: Personaggio, conScudo = true): number {
  const des = mod(pg, 'des');
  const daDestrezza =
    pg.armatura.tipo === 'pesante' ? 0 : pg.armatura.tipo === 'media' ? Math.min(des, 2) : des;
  return pg.armatura.ca + daDestrezza + (conScudo ? pg.armatura.scudo : 0);
}

export function cdIncantesimi(pg: Personaggio): number {
  return 8 + pg.competenza + mod(pg, pg.caratteristicaIncantesimi);
}

export function attaccoIncantesimi(pg: Personaggio): number {
  return pg.competenza + mod(pg, pg.caratteristicaIncantesimi);
}

function attacco(pg: Personaggio, id: string) {
  const a = pg.attacchi.find((x) => x.id === id);
  if (!a) throw new Error(`Attacco sconosciuto: ${id}`);
  return a;
}

export interface ParteTiro {
  etichetta: string;
  valore: number;
}

/** Le parti del tiro, nell'ordine in cui si leggono sulla card. `perColpire`
 *  è la loro somma e non un calcolo parallelo: due strade per lo stesso numero
 *  sono due strade che prima o poi divergono. */
export function scomposizioneColpire(pg: Personaggio, idAttacco: string): ParteTiro[] {
  const a = attacco(pg, idAttacco);
  const parti: ParteTiro[] = [
    { etichetta: a.caratteristica.toUpperCase(), valore: mod(pg, a.caratteristica) },
  ];
  if (a.competente) parti.push({ etichetta: 'competenza', valore: pg.competenza });
  return parti;
}

export function perColpire(pg: Personaggio, idAttacco: string): number {
  return scomposizioneColpire(pg, idAttacco).reduce((t, p) => t + p.valore, 0);
}

export function dannoTesto(pg: Personaggio, idAttacco: string): string {
  const a = attacco(pg, idAttacco);
  const bonus = mod(pg, a.caratteristica) + a.danno.fisso;
  if (a.danno.dado === null) return `${bonus}`;
  return bonus === 0 ? a.danno.dado : `${a.danno.dado} ${bonus < 0 ? '-' : '+'} ${Math.abs(bonus)}`;
}

export function percezionePassiva(pg: Personaggio): number {
  return 10 + bonusAbilita(pg, 'Percezione');
}

export function iniziativa(pg: Personaggio): number {
  return mod(pg, 'des');
}

/** Corporatura Possente: conta come una taglia più grande, quindi il doppio. */
export function capacitaTrasporto(pg: Personaggio): number {
  return pg.caratteristiche.for * 15 * 2;
}
