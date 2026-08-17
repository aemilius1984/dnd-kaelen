import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CarteIncantesimo from '@/components/CarteIncantesimo.astro';
import { caricaIncantesimi } from '@/lib/carica-personaggio';

// Come per gli attacchi: sotto vitest le content collection sono vuote, quindi
// gli incantesimi si leggono da disco con lo stesso schema.
const tutti = caricaIncantesimi();
const con = (slug: string) => {
  const m = tutti.get(slug);
  if (!m) throw new Error(`Incantesimo mancante nel test: ${slug}`);
  return { ...m, slug, testo: 'testo di prova' };
};

const trucchetto = con('fiamma-sacra');
const diLivello = con('cura-ferite');

async function rendi(incantesimi: ReturnType<typeof con>[]): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CarteIncantesimo, { props: { incantesimi } });
}

describe('la testa della card', () => {
  it('porta sigillo, nome doppio, livello e i dati del lancio', async () => {
    const html = await rendi([diLivello]);

    expect(html).toContain('<use href="#sig-cura-ferite"');
    expect(html).toContain('Cura Ferite');
    expect(html).toContain('Cure Wounds');
    expect(html).toContain(diLivello.lancio);
    expect(html).toContain(diLivello.gittata);
  });

  it('mostra TS e danno solo dove esistono', async () => {
    const conTiro = con('fiamma-sacra');
    const html = await rendi([conTiro]);

    expect(conTiro.tiro).not.toBeNull();
    expect(html).toContain(`TS ${conTiro.tiro}`);
    expect(html).toContain(conTiro.danno!);
  });
});

describe('trucchetti e incantesimi di livello', () => {
  it('un trucchetto si dichiara a volontà e non porta il contenitore di lancio', async () => {
    const html = await rendi([trucchetto]);

    expect(html).toContain('a volontà');
    expect(html).toContain('At Will');
    // Nessuno slot da spendere: un contenitore vuoto qui sarebbe un bottone
    // che non comparirà mai.
    expect(html).not.toContain('data-lancio');
  });

  it('un incantesimo di livello porta il contenitore che l’isola cerca', async () => {
    const html = await rendi([diLivello]);

    expect(html).toContain(`data-lancio="${diLivello.slug}"`);
    expect(html).toContain(`data-livello="${diLivello.livello}"`);
    expect(html).not.toContain('a volontà');
  });
});

it('rende una card per incantesimo, una per riga', async () => {
  const html = await rendi([trucchetto, diLivello]);

  expect(html.match(/class="[^"]*superficie/g) ?? []).toHaveLength(2);
});

it('parte nascosto solo ciò che non è preparato, e solo se glielo si chiede', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(CarteIncantesimo, {
    props: { incantesimi: [diLivello], visibiliDiDefault: [] },
  });

  // I 32 incantesimi del pool sono tutti in HTML statico: `hidden` scritto in
  // build è ciò che li tiene fuori dallo schermo senza attendere JavaScript.
  expect(html).toContain('hidden');
  expect(html).toContain(`data-slug="${diLivello.slug}"`);
});
