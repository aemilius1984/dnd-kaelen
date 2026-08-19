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
    // Il markup come lo genera `CarteIncantesimo.astro`: la carta è una riga
    // muta, e il contenitore vuoto sta dentro la *modale*, che è fuori dalla
    // carta. L'isola trova il contenitore con [data-lancio] e la carta da
    // spegnere con [data-carta] — risalire con `closest` non funzionerebbe
    // più, ed è il difetto che questa disposizione impedisce di riportare.
    `<div class="superficie incantesimo" data-carta="cura-ferite">` +
    `<button class="apri-incantesimo">Cura Ferite</button>` +
    `</div>` +
    `<dialog class="incantesimo-pieno">` +
    `<div class="lancio" data-lancio="cura-ferite" data-livello="1"></div>` +
    `</dialog>`;
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
  for (let i = 0; i < 4; i++) muta((x) => spendiSlot(x, pg, 1, 'comando'));
  for (let i = 0; i < 2; i++) muta((x) => spendiSlot(x, pg, 2, 'frantumare'));
  await giro();

  expect(carta().getAttribute('aria-disabled')).toBe('true');
  expect(contenitore().querySelectorAll('button')).toHaveLength(0);
  // La testa resta leggibile: è il motivo per cui si spegne invece di sparire.
  expect(carta().textContent).toContain('Cura Ferite');
  expect(carta().hidden).toBe(false);
});

it('recuperare uno slot riaccende la card', async () => {
  for (let i = 0; i < 4; i++) muta((x) => spendiSlot(x, pg, 1, 'comando'));
  for (let i = 0; i < 2; i++) muta((x) => spendiSlot(x, pg, 2, 'frantumare'));
  await giro();
  expect(carta().getAttribute('aria-disabled')).toBe('true');

  // `annulla` nell'isola fa esattamente questo.
  const { recuperaSlot } = await import('@/lib/sheet-state');
  muta((x) => recuperaSlot(x, 1));
  await giro();

  expect(carta().getAttribute('aria-disabled')).not.toBe('true');
  expect(contenitore().querySelectorAll('button').length).toBeGreaterThan(0);
});

it('trova la carta per slug, non risalendo dal contenitore', async () => {
  // Con `closest` la carta si trovava solo perché il contenitore le stava
  // dentro. Spostato il contenitore nella modale, quel legame non c'è più: se
  // qualcuno lo ripristina, la carta resta accesa a slot finiti e nient'altro
  // se ne accorge. Qui la carta è deliberatamente *lontana* dal contenitore.
  expect(carta().closest('dialog')).toBeNull();
  expect(contenitore().closest('.incantesimo')).toBeNull();

  for (let i = 0; i < 4; i++) muta((x) => spendiSlot(x, pg, 1, 'cura-ferite'));
  for (let i = 0; i < 2; i++) muta((x) => spendiSlot(x, pg, 2, 'cura-ferite'));
  await giro();

  expect(carta().classList.contains('spenta')).toBe(true);
});
