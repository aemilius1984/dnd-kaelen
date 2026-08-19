// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import BarraSlot from '@/islands/BarraSlot';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { SPESA_MANUALE, spendiSlot, statoIniziale } from '@/lib/sheet-state';
import { muta } from '@/lib/storage';

// Guardando la scheda si deve poter capire *dove* sono finiti gli slot: due
// caselle di 2° vuote non dicono niente, due caselle con il sigillo di
// Frantumare dicono che la serata è andata così.
//
// Le file le disegna `FilaSlot`, e si guardano attraverso `BarraSlot` aperta,
// che è il solo posto della Scheda in cui compaiono. Provarle montate dentro
// chi le usa costa un click in più e verifica anche che quel click esista.

const pg = caricaPersonaggioDaFile();

let radice: HTMLDivElement;

const giro = () => new Promise((r) => setTimeout(r, 50));

/** Le caselle della fila di un livello, in ordine da sinistra. */
/** Le file esistono solo a barra aperta: è la forma scelta negli sketch. */
const apri = async () => {
  radice.querySelector<HTMLButtonElement>('.riassunto')!.click();
  await giro();
};

const fila = (livello: number): HTMLElement[] => {
  const etichetta = new RegExp(`slot di ${livello}° livello`);
  const gruppo = [...radice.querySelectorAll<HTMLElement>('.caselle')].find((n) =>
    etichetta.test(n.getAttribute('aria-label') ?? ''),
  )!;
  return [...gruppo.querySelectorAll<HTMLElement>('.casella')];
};

const usati = (livello: number) => fila(livello).filter((c) => c.querySelector('use'));

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>`;
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(BarraSlot, {}), radice);
  // `stato` è un signal di modulo e `assicuraInizializzato` gira una volta
  // sola: svuotare localStorage non lo riporta indietro, e senza questo ogni
  // prova eredita gli slot spesi dalla precedente.
  muta(() => statoIniziale(pg, 'v-test'));
  await giro();
});

afterEach(() => {
  render(null, radice);
});

it('a stato pieno nessuna casella porta un sigillo', async () => {
  await apri();
  for (const x of pg.slot) {
    expect(fila(x.livello)).toHaveLength(x.max);
    expect(usati(x.livello)).toHaveLength(0);
  }
});

it('la casella consumata porta il sigillo dell’incantesimo che l’ha spesa', async () => {
  await apri();
  muta((x) => spendiSlot(x, pg, 1, 'cura-ferite'));
  await giro();

  const conSigillo = usati(1);
  expect(conSigillo).toHaveLength(1);
  expect(conSigillo[0].querySelector('use')?.getAttribute('href')).toBe('#sig-cura-ferite');
});

it('lo slot speso a mano porta un segno neutro, non un sigillo altrui', async () => {
  await apri();
  muta((x) => spendiSlot(x, pg, 1, SPESA_MANUALE));
  await giro();

  const casella = fila(1).find((c) => c.classList.contains('manuale'));
  expect(casella).toBeDefined();
  // Nessun `<use>`: un sigillo qui attribuirebbe lo slot a un incantesimo che
  // nessuno ha lanciato.
  expect(casella!.querySelector('use')).toBeNull();
});

it('le caselle si consumano da destra, così la prima spesa resta dov’è', async () => {
  await apri();
  muta((x) => spendiSlot(x, pg, 1, 'benedizione'));
  await giro();
  const dopoUna = fila(1).map((c) => c.querySelector('use')?.getAttribute('href') ?? null);

  muta((x) => spendiSlot(x, pg, 1, 'comando'));
  await giro();
  const dopoDue = fila(1).map((c) => c.querySelector('use')?.getAttribute('href') ?? null);

  // Benedizione non si sposta quando ne arriva un'altra: se le caselle si
  // rimescolassero, guardare la fila non direbbe più niente.
  expect(dopoUna.at(-1)).toBe('#sig-benedizione');
  expect(dopoDue.at(-1)).toBe('#sig-benedizione');
  expect(dopoDue.at(-2)).toBe('#sig-comando');
});

it('il numero di caselle non cambia mai: sono il massimo, piene o no', async () => {
  await apri();
  for (let i = 0; i < 4; i++) muta((x) => spendiSlot(x, pg, 1, 'comando'));
  await giro();

  expect(fila(1)).toHaveLength(pg.slot.find((x) => x.livello === 1)!.max);
});

it('un incantesimo senza sigillo proprio ricade sul segno neutro', async () => {
  await apri();
  // Il pool preparabile è di 32 incantesimi e i sigilli disegnati sono
  // tredici: chi non ce l'ha non deve prendere in prestito quello di un
  // altro. `simbolo()` ripiegherebbe sull'icona del tag, che qui direbbe una
  // cosa falsa — «un incantesimo di cura» invece di «questo incantesimo».
  muta((x) => spendiSlot(x, pg, 1, 'santuario'));
  await giro();

  expect(usati(1)).toHaveLength(0);
  expect(fila(1).filter((c) => c.classList.contains('manuale'))).toHaveLength(1);
});
