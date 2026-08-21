import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { sigilloUso } from '@/lib/sigilli';

const pg = caricaPersonaggioDaFile();
const sprite = readFileSync('src/components/Sprite.astro', 'utf8');

describe('i sigilli degli usi', () => {
  it('esistono nello sprite, uno per uso', () => {
    // Un `<use href="#…">` che punta a un simbolo assente non fallisce: mostra
    // un riquadro vuoto e nient'altro. Un uso aggiunto ai dati senza il suo
    // glifo passerebbe come casella muta, e nessuno saprebbe perché.
    const usi = pg.risorse.flatMap((r) => r.usi ?? []);

    expect(usi.length).toBeGreaterThan(0);
    for (const u of usi) expect(sprite).toContain(`id="${sigilloUso(u.id)}"`);
  });
});
