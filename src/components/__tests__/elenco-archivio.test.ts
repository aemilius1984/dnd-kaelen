import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ElencoArchivio from '@/components/ElencoArchivio.astro';
import { caricaIncantesimi, caricaPersonaggioDaFile } from '@/lib/carica-personaggio';

const pg = caricaPersonaggioDaFile();
const magie = caricaIncantesimi();

const tutti = [...magie.entries()].map(([slug, m]) => ({ ...m, slug, testo: 'testo di prova' }));

// Il pool preparabile è ciò che `carica-scheda.ts` costruisce: di livello e non
// di dominio. I trucchetti ne restano fuori per il livello 0.
const preparabili = tutti
  .filter((m) => m.livello > 0 && !m.dominio)
  .map((m) => m.slug)
  .filter((slug) => !pg.dominio.includes(slug));

async function rendi(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ElencoArchivio, {
    props: { incantesimi: tutti, preparabili },
  });
}

describe('la struttura dell’elenco', () => {
  it('raggruppa per livello, dai trucchetti in su', async () => {
    const html = await rendi();

    expect(html).toContain('Trucchetti');
    expect(html).toContain('1° livello');
    expect(html).toContain('2° livello');
    // I trucchetti stanno prima: l'ordine di lettura segue l'ordine con cui si
    // scorre la lista al tavolo.
    expect(html.indexOf('Trucchetti')).toBeLessThan(html.indexOf('2° livello'));
  });

  it('porta ogni incantesimo, con nome doppio e testo', async () => {
    const html = await rendi();

    for (const m of tutti) {
      expect(html, `manca ${m.slug}`).toContain(m.nome);
    }
    expect(html).toContain('Cure Wounds');
    expect(html).toContain('testo di prova');
  });

  it('porta i dati che fanno decidere se prepararlo', async () => {
    const html = await rendi();
    const cura = magie.get('cura-ferite')!;

    expect(html).toContain(cura.lancio);
    expect(html).toContain(cura.gittata);
    expect(html).toContain('rituale · Ritual');
  });
});

describe('dove si può spuntare e dove no', () => {
  it('un contenitore per ogni incantesimo preparabile, e nessuno di più', async () => {
    const html = await rendi();

    expect(html.match(/data-preparabile=/g) ?? []).toHaveLength(preparabili.length);
    for (const slug of preparabili) expect(html).toContain(`data-preparabile="${slug}"`);
  });

  it('trucchetti e dominio compaiono ma non si spuntano', async () => {
    const html = await rendi();

    // Ci sono: si leggono come tutti gli altri.
    expect(html).toContain('Fiamma Sacra');
    expect(html).toContain('Frantumare');
    // Ma senza contenitore: sono sempre disponibili, e una spunta disabilitata
    // sarebbe l'invito a un gesto che non serve.
    for (const slug of [...pg.trucchetti, ...pg.dominio]) {
      expect(html).not.toContain(`data-preparabile="${slug}"`);
    }
    expect(html).toContain('sempre');
  });
});
