// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import Archivio from '@/islands/Archivio';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale, togglePreparato } from '@/lib/sheet-state';
import { muta, stato } from '@/lib/storage';

const pg = caricaPersonaggioDaFile();

// Quattro slug di livello che non stanno fra i preparati iniziali: servono a
// riempire il limite e a superarlo.
const ALTRI = ['santuario', 'iettatura', 'silenzio', 'presagio'];

let radice: HTMLDivElement;

/** Il portale arriva un giro dopo l'effetto che trova i contenitori: un solo
 *  microtask non basta. */
const giro = () => new Promise((r) => setTimeout(r, 50));

const spunta = (slug: string) =>
  document.querySelector<HTMLInputElement>(`[data-preparabile="${slug}"] input`);

beforeEach(async () => {
  localStorage.clear();
  const contenitori = [...pg.preparatiIniziali, ...ALTRI]
    .map((slug) => `<div data-preparabile="${slug}"></div>`)
    .join('');
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    contenitori;
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Archivio, {}), radice);
  // `stato` è un signal di modulo: senza questo ogni prova eredita i
  // preparati della precedente.
  muta(() => statoIniziale(pg, 'v-test'));
  await giro();
});

afterEach(() => {
  render(null, radice);
});

it('mette una spunta per contenitore, con lo stato dei preparati', async () => {
  for (const slug of pg.preparatiIniziali) expect(spunta(slug)?.checked).toBe(true);
  for (const slug of ALTRI) expect(spunta(slug)?.checked).toBe(false);
});

it('al limite disabilita solo le spunte non messe', async () => {
  // Sei preparati iniziali su un limite di sei: si parte già pieni.
  expect(pg.preparatiIniziali).toHaveLength(pg.limitePreparati);

  for (const slug of pg.preparatiIniziali) expect(spunta(slug)?.disabled).toBe(false);
  for (const slug of ALTRI) expect(spunta(slug)?.disabled).toBe(true);
});

it('togliere una preparazione riapre le altre', async () => {
  muta((x) => togglePreparato(x, pg, pg.preparatiIniziali[0]));
  await giro();

  for (const slug of ALTRI) expect(spunta(slug)?.disabled).toBe(false);
});

it('spuntare scrive nello stato', async () => {
  muta((x) => togglePreparato(x, pg, pg.preparatiIniziali[0]));
  await giro();

  spunta('santuario')!.click();
  await giro();

  expect(stato.value.preparati).toContain('santuario');
  expect(spunta('santuario')?.checked).toBe(true);
});

it('non c’è modo di preparare un trucchetto o un incantesimo di dominio', async () => {
  // Non hanno contenitore: l'elenco statico non gliene dà uno, quindi l'isola
  // non ha dove disegnare una spunta. La regola sta comunque anche in
  // `togglePreparato`, ma qui non serve nemmeno invocarla.
  for (const slug of [...pg.trucchetti, ...pg.dominio]) {
    expect(spunta(slug)).toBeNull();
  }
});
