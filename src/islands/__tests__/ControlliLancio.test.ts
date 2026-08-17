// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import ControlliLancio from '@/islands/ControlliLancio';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { spendiSlot } from '@/lib/sheet-state';
import { muta } from '@/lib/storage';

// Il giocatore lancia dalla pagina principale, non da una modale: la card che
// non si può più lanciare deve dirlo *restando dov'è*, spenta. Nasconderla
// toglierebbe di mezzo proprio i numeri che si guardano per decidere se
// conviene un Riposo Breve.

const pg = caricaPersonaggioDaFile();

let radice: HTMLDivElement;

/** Preact accoda i rendering, e il portale arriva un giro dopo l'effetto che
 *  trova i contenitori: un solo microtask non basta. */
const giro = () => new Promise((r) => setTimeout(r, 50));

const carta = () => document.querySelector<HTMLElement>('.incantesimo')!;
const contenitore = () => document.querySelector<HTMLElement>('[data-lancio]')!;

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    // La card come la genera `CarteIncantesimo.astro`: il contenitore vuoto è
    // dentro la superficie, e l'isola lo trova con [data-lancio].
    `<div class="superficie incantesimo">` +
    `<div class="testa">Cura Ferite</div>` +
    `<div class="lancio" data-lancio="cura-ferite" data-livello="1"></div>` +
    `</div>`;
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(ControlliLancio, {}), radice);
  await giro();
});

afterEach(() => {
  render(null, radice);
});

it('con slot disponibili la card è viva e offre i bottoni', () => {
  expect(carta().getAttribute('aria-disabled')).not.toBe('true');
  expect(contenitore().querySelectorAll('button').length).toBeGreaterThan(0);
});

it('a slot esauriti la card si spegne, senza sparire', async () => {
  // Quattro slot di 1° e due di 2°: finiti quelli, un incantesimo di 1° non ha
  // più niente con cui essere lanciato.
  for (let i = 0; i < 4; i++) muta((x) => spendiSlot(x, pg, 1));
  for (let i = 0; i < 2; i++) muta((x) => spendiSlot(x, pg, 2));
  await giro();

  expect(carta().getAttribute('aria-disabled')).toBe('true');
  expect(contenitore().querySelectorAll('button')).toHaveLength(0);
  // La testa resta leggibile: è il motivo per cui si spegne invece di sparire.
  expect(carta().textContent).toContain('Cura Ferite');
  expect(carta().hidden).toBe(false);
});

it('recuperare uno slot riaccende la card', async () => {
  for (let i = 0; i < 4; i++) muta((x) => spendiSlot(x, pg, 1));
  for (let i = 0; i < 2; i++) muta((x) => spendiSlot(x, pg, 2));
  await giro();
  expect(carta().getAttribute('aria-disabled')).toBe('true');

  // `annulla` nell'isola fa esattamente questo.
  const { recuperaSlot } = await import('@/lib/sheet-state');
  muta((x) => recuperaSlot(x, 1));
  await giro();

  expect(carta().getAttribute('aria-disabled')).not.toBe('true');
  expect(contenitore().querySelectorAll('button').length).toBeGreaterThan(0);
});
