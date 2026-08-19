// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, render } from 'preact';
import ControlliLancio from '@/islands/ControlliLancio';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { spendiSlot } from '@/lib/sheet-state';
import { muta, stato } from '@/lib/storage';

// La card che non si può più lanciare deve dirlo *restando dov'è*, spenta:
// nasconderla toglierebbe di mezzo proprio i numeri che si guardano per
// decidere se conviene un Riposo Breve. Il lancio invece parte dalla modale, e
// da lì in poi la modale ha finito: si chiude, e la striscia di annullamento
// resta l'unica cosa che racconta cosa è appena stato speso.

const pg = caricaPersonaggioDaFile();

let radice: HTMLDivElement;

/** Preact accoda i rendering, e il portale arriva un giro dopo l'effetto che
 *  trova i contenitori: un solo microtask non basta. */
const giro = () => new Promise((r) => setTimeout(r, 50));

const carta = () => document.querySelector<HTMLElement>('.incantesimo')!;
const contenitore = () => document.querySelector<HTMLElement>('[data-lancio]')!;
const modale = () => document.querySelector<HTMLDialogElement>('dialog')!;
const striscia = () => document.querySelector<HTMLElement>('.striscia-annulla');

/** Il bottone «Lancia 1°» dentro la modale. */
const bottoneLancio = () =>
  [...contenitore().querySelectorAll('button')].find((b) => b.textContent?.includes('1°'))!;

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
    `<div class="lancio" data-lancio="cura-ferite" data-nome="Cura Ferite" data-livello="1"></div>` +
    `</dialog>`;
  // jsdom dichiara `HTMLDialogElement` ma non implementa `close()`: senza
  // questo rimpiazzo il lancio esploderebbe qui e in nessun browser. Fa la sola
  // cosa che al test interessa — l'attributo `open` cade.
  const d = document.querySelector('dialog')!;
  Object.assign(d, { close: () => d.removeAttribute('open') });

  // `stato` è un segnale di modulo: `inizializzato` resta vero fra un test e
  // l'altro, quindi svuotare localStorage non lo riporta indietro e gli slot
  // spesi da un test arrivano al successivo. Ogni test parte da slot pieni.
  muta((x) => ({ ...x, slotSpesi: {} }));
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

describe('dopo il lancio', () => {
  // jsdom non implementa il top layer, quindi qui non si può *misurare* che la
  // modale copriva la striscia: quello è stato misurato nel browser (la modale
  // è a tutto schermo, con sfondo opaco, e nessuno `z-index` la scavalca).
  // Quel che si può fissare qui è la conseguenza — la modale si chiude — e che
  // la striscia dica cosa è stato speso.

  it('la modale si chiude: da lì in poi non ha più niente da dire', async () => {
    modale().setAttribute('open', '');
    expect(modale().open).toBe(true);
    bottoneLancio().click();
    await giro();

    expect(modale().open).toBe(false);
  });

  it('la striscia nomina l’incantesimo, non solo il livello dello slot', async () => {
    bottoneLancio().click();
    await giro();

    // Il livello da solo non basta: fra i preparati di 1° ce ne sono sei, e la
    // modale che li distingueva si è appena chiusa.
    expect(striscia()?.textContent).toContain('Cura Ferite');
    expect(striscia()?.textContent).toContain('Slot di 1° speso');
  });

  it('il velo arriva e se ne va insieme alla striscia', async () => {
    const velo = () => document.querySelector('.velo-annulla');
    expect(velo()).toBeNull();

    bottoneLancio().click();
    await giro();
    expect(velo()).not.toBeNull();

    striscia()!.querySelector('button')!.click();
    await giro();

    // Un velo che sopravvive alla striscia lascia la scheda scurita e basta:
    // non intercetta i tocchi, quindi nessuno lo scoprirebbe provando a
    // premere qualcosa — si vedrebbe soltanto, e a lungo.
    expect(velo()).toBeNull();
  });

  it('annullare restituisce lo slot e toglie la striscia', async () => {
    bottoneLancio().click();
    await giro();
    expect(stato.value.slotSpesi[1]).toHaveLength(1);

    striscia()!.querySelector('button')!.click();
    await giro();

    expect(stato.value.slotSpesi[1] ?? []).toHaveLength(0);
    expect(striscia()).toBeNull();
  });

  it('la barra finisce quando finisce il diritto di annullare', async () => {
    vi.useFakeTimers();
    try {
      bottoneLancio().click();
      // Preact accoda i propri effetti su timer: prima di far scorrere la
      // finestra bisogna lasciargli montare la striscia, altrimenti il test
      // guarderebbe un vuoto che non è ancora stato riempito.
      await vi.advanceTimersByTimeAsync(200);
      expect(striscia()).not.toBeNull();

      // La durata si legge da dove la legge il CSS, non da un numero riscritto
      // qui: così il test lega davvero le due cose invece di ripetere una
      // costante. Una barra che finisse prima lascerebbe una striscia ferma su
      // «vuoto» ma ancora premibile; una che finisse dopo prometterebbe tempo
      // già scaduto. I margini sono larghi (20%) perché preact monta i propri
      // effetti con qualche millisecondo di ritardo.
      const durata = Number.parseInt(striscia()!.style.getPropertyValue('--durata-annulla'), 10);
      expect(durata).toBeGreaterThan(0);

      await vi.advanceTimersByTimeAsync(Math.round(durata * 0.8));
      expect(striscia()).not.toBeNull();

      await vi.advanceTimersByTimeAsync(Math.round(durata * 0.2) + 100);

      expect(striscia()).toBeNull();
      // Scaduta la finestra lo slot è speso e basta: non c'è più niente da
      // premere per riaverlo.
      expect(stato.value.slotSpesi[1]).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
