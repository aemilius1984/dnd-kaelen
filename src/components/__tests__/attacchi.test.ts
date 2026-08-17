import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import Attacchi from '@/components/Attacchi.astro';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';

// `caricaScheda()` non è utilizzabile qui: sotto vitest le content collection
// sono vuote (vedi il commento in `src/pages/__tests__/scheda.test.ts`).
// `caricaPersonaggioDaFile` legge lo stesso frontmatter da disco e lo valida
// con lo stesso schema — è la via che usano già tutti gli altri test.
const pg = caricaPersonaggioDaFile();

async function rendi(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Attacchi, { props: { pg } });
}

it('rende una card per arma, non una tabella', async () => {
  const html = await rendi();

  expect(html).not.toContain('<table');
  expect(html.match(/class="[^"]*superficie/g) ?? []).toHaveLength(pg.attacchi.length);
});

it('mostra il tiro come totale, come dado e come scomposizione', async () => {
  const html = await rendi();

  expect(html).toContain('+5');
  expect(html).toContain('1d20+5');
  // La scomposizione è ciò che salva quando il DM chiede se la competenza è
  // contata: deve esserci, non solo il totale.
  expect(html).toContain('FOR');
  expect(html).toContain('competenza');
});

it('porta il nome inglese di ogni arma', async () => {
  const html = await rendi();

  for (const a of pg.attacchi) expect(html).toContain(a.nomeEn);
});

it('mostra danno, tipo di danno e gittata di ogni attacco', async () => {
  const html = await rendi();

  // Il colpo senz'armi non ha dado: `dannoTesto` dà «4», che senza il tipo di
  // danno accanto non dice niente.
  expect(html).toContain('1d8 + 3');
  expect(html).toContain('1d10 + 3');
  expect(html).toContain('contundenti');
  expect(html).toContain('5 ft');
});

it('mostra le proprietà solo dove ci sono', async () => {
  const html = await rendi();

  // Versatile spiega perché il maglio occupa due card: se sparisce, le due
  // righe sembrano due armi diverse.
  expect(html.match(/Versatile \(1d10\)/g) ?? []).toHaveLength(2);
});
