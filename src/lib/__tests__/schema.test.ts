import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';

describe('scheda di Kaelen', () => {
  const pg = caricaPersonaggioDaFile();

  it('valida lo schema del personaggio', () => {
    expect(pg.nome).toBe('Kaelen');
    expect(pg.livello).toBe(3);
  });

  it('contiene i punteggi di caratteristica grezzi', () => {
    expect(pg.caratteristiche).toEqual({ for: 16, des: 12, cos: 13, int: 10, sag: 16, car: 8 });
  });

  it('dichiara tre risorse con il loro recupero', () => {
    expect(pg.risorse.map((r) => r.id)).toEqual(['incanalare', 'ira-tempesta', 'tuono-tempesta']);
    expect(pg.risorse.find((r) => r.id === 'incanalare')?.recupero).toBe('breve');
  });

  it('dichiara sei incantesimi preparati iniziali e quattro del dominio', () => {
    expect(pg.preparatiIniziali).toHaveLength(6);
    expect(pg.dominio).toHaveLength(4);
    expect(pg.limitePreparati).toBe(6);
  });

  // Regressione: una virgola in un flow-mapping YAML può troncare un campo
  // senza che lo schema se ne accorga (Task 2 l'ha scoperto solo con un dump
  // manuale). Questo controlla che la nota del simbolo sacro sia intera.
  it('non tronca la nota del simbolo sacro nel flow-mapping YAML', () => {
    expect(pg.equipaggiamento.find((e) => e.id === 'simbolo-sacro')?.note).toBe(
      'Focus da incantatore, indossato sul petto.',
    );
  });

  it('pretende un nome inglese ovunque si nomini una regola', () => {
    // Un `nomeEn` vuoto è indistinguibile da uno dimenticato: se il nome
    // ufficiale non lo conosciamo, il posto dove dirlo è il rapporto, non i dati.
    const vuoti: string[] = [];
    for (const a of pg.attacchi) if (!a.nomeEn.trim()) vuoti.push(`attacco ${a.id}`);
    for (const r of pg.risorse) if (!r.nomeEn.trim()) vuoti.push(`risorsa ${r.id}`);
    for (const r of pg.reazioni) if (!r.nomeEn.trim()) vuoti.push(`reazione ${r.nome}`);
    for (const e of pg.equipaggiamento) if (!e.nomeEn.trim()) vuoti.push(`oggetto ${e.id}`);
    for (const a of pg.abilita) if (!a.nomeEn.trim()) vuoti.push(`abilità ${a.nome}`);

    expect(vuoti).toEqual([]);
  });

  it('lega ogni reazione con contatore a una risorsa che esiste', () => {
    const id = new Set(pg.risorse.map((r) => r.id));
    const rotte = pg.reazioni.filter((r) => r.risorsa !== undefined && !id.has(r.risorsa));

    expect(rotte).toEqual([]);
  });

  // Le due righe del maglio sono lo stesso oggetto impugnato in due modi: è la
  // proprietà Versatile a spiegare perché esistono, quindi il nome ufficiale
  // resta uno solo. `REGOLAMENTO_IT_EN.md` lo dice esplicitamente.
  it('non inventa qualificatori assenti dal nome ufficiale dell’arma', () => {
    const maglio = pg.attacchi.filter((a) => a.id.startsWith('maglio-'));

    expect(maglio).toHaveLength(2);
    expect(maglio.map((a) => a.nomeEn)).toEqual(['Warhammer', 'Warhammer']);
  });
});
