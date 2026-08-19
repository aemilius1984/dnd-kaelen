// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import Archivio from '@/islands/Archivio';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale } from '@/lib/sheet-state';
import { annulla, apri, bozza } from '@/lib/preparazione';
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
const conferma = () => radice.querySelector<HTMLButtonElement>('.conferma');
// Il cappello è markup statico della pagina e l'isola ci disegna dentro per
// portale: si cerca nel documento, non nella radice dell'isola.
const sblocca = () => document.querySelector<HTMLButtonElement>('.sblocca');
const conto = () => document.querySelector('[data-preparazione] .conto')?.textContent ?? '';

/** Apre la sessione come farebbe la fine di un Riposo Lungo. */
const apriSessione = async () => {
  apri(stato.value.preparati);
  await giro();
};

beforeEach(async () => {
  localStorage.clear();
  const contenitori = [...pg.preparatiIniziali, ...ALTRI]
    .map((slug) => `<div data-preparabile="${slug}"></div>`)
    .join('');
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    // Il cappello appiccicato in cima alla pagina: la X è statica, il conto e
    // il comando li scrive l'isola qui dentro.
    `<div class="barra-preparati"><a class="ics" href="/scheda/"></a>` +
    `<div class="stato-preparazione" data-preparazione></div></div>` +
    contenitori;
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Archivio, {}), radice);
  // `stato` è un signal di modulo: senza questo ogni prova eredita i
  // preparati della precedente.
  muta(() => statoIniziale(pg, 'v-test'));
  annulla();
  await giro();
});

afterEach(() => {
  render(null, radice);
});

it('mette una spunta per contenitore, con lo stato dei preparati', async () => {
  for (const slug of pg.preparatiIniziali) expect(spunta(slug)?.checked).toBe(true);
  for (const slug of ALTRI) expect(spunta(slug)?.checked).toBe(false);
});

it('fuori da una sessione le spunte sono in sola lettura', async () => {
  // È il P0: il manuale fa cambiare i sei preparati solo alla fine di un
  // Riposo Lungo. Prima si potevano commutare in qualsiasi momento.
  for (const slug of [...pg.preparatiIniziali, ...ALTRI]) {
    expect(spunta(slug)?.disabled).toBe(true);
  }
  expect(conferma()).toBeNull();
  expect(sblocca()).not.toBeNull();
});

it('aperta la sessione, le spunte si attivano', async () => {
  await apriSessione();

  for (const slug of [...pg.preparatiIniziali, ...ALTRI]) {
    expect(spunta(slug)?.disabled).toBe(false);
  }
});

it('spuntare cambia la bozza e non lo stato salvato', async () => {
  // «La bozza non deve essere salvata nello stato canonico finché non è
  // confermata»: chiudere la pagina a metà scelta non deve lasciare cinque
  // preparati in localStorage, che è uno stato fuori regola.
  await apriSessione();

  spunta(pg.preparatiIniziali[0])!.click();
  await giro();

  expect(bozza.value).toHaveLength(pg.limitePreparati - 1);
  expect(stato.value.preparati).toHaveLength(pg.limitePreparati);
  expect(stato.value.preparati).toContain(pg.preparatiIniziali[0]);
});

it('non si conferma finché non sono esattamente sei', async () => {
  await apriSessione();
  expect(conferma()?.disabled).toBe(false);

  spunta(pg.preparatiIniziali[0])!.click();
  await giro();

  expect(conferma()?.disabled).toBe(true);
});

it('confermare scrive i nuovi sei e chiude la sessione', async () => {
  await apriSessione();
  spunta(pg.preparatiIniziali[0])!.click();
  await giro();
  spunta('santuario')!.click();
  await giro();

  conferma()!.click();
  await giro();

  expect(stato.value.preparati).toContain('santuario');
  expect(stato.value.preparati).not.toContain(pg.preparatiIniziali[0]);
  expect(bozza.value).toBeNull();
  expect(spunta('santuario')?.disabled).toBe(true);
});

it('annullare non lascia una lista intermedia né tocca lo stato', async () => {
  await apriSessione();
  spunta(pg.preparatiIniziali[0])!.click();
  await giro();

  radice.querySelector<HTMLButtonElement>('.annulla')!.click();
  await giro();

  expect(bozza.value).toBeNull();
  expect(stato.value.preparati).toHaveLength(pg.limitePreparati);
});

it('il comando dice cosa fa il tocco, non chi lo concede', async () => {
  // Diceva «Modifica concessa dal DM»: raccontava il permesso invece
  // dell'azione. Il permesso si dà per scontato — al tavolo il DM è lì — e la
  // regola vera («si cambiano alla fine di un Riposo Lungo») è salita nel
  // cappello della pagina, dove si legge una volta invece che accanto a ogni
  // tocco.
  expect(sblocca()!.textContent).toMatch(/sblocca/i);
  expect(document.body.textContent).not.toMatch(/concessa dal dm/i);

  sblocca()!.click();
  await giro();

  expect(bozza.value).not.toBeNull();
});

it('il conto sta nel cappello, e a sessione aperta dice quanti ne mancano', async () => {
  // Stava in fondo alla pagina, cioè dopo trentanove incantesimi: scorrendo
  // l'elenco non si sapeva mai a che punto si era.
  expect(conto()).toMatch(/6 su 6 preparati/);
  expect(radice.querySelector('.barra-preparazione')).toBeNull();

  await apriSessione();
  spunta(pg.preparatiIniziali[0])!.click();
  await giro();

  expect(conto()).toMatch(/5 su 6/);
  expect(conto()).toMatch(/scegline ancora 1/);
  // Il piede porta solo i due comandi: il conto non è scritto due volte.
  expect(radice.querySelector('.barra-preparazione .conto')).toBeNull();
});

it('sbloccata, il comando diventa il nome dello stato', async () => {
  await apriSessione();

  // Sbloccare due volte non vuol dire niente, e un bottone che non fa niente
  // è un bottone che si prova.
  expect(sblocca()).toBeNull();
  expect(document.querySelector('[data-preparazione] .aperta')?.textContent).toMatch(/sbloccata/i);
});

it('non c’è modo di preparare un trucchetto o un incantesimo di dominio', async () => {
  // Non hanno contenitore: l'elenco statico non gliene dà uno, quindi l'isola
  // non ha dove disegnare una spunta. La regola sta comunque anche in
  // `commuta` e in `impostaPreparati`, ma qui non serve nemmeno invocarla.
  for (const slug of [...pg.trucchetti, ...pg.dominio]) {
    expect(spunta(slug)).toBeNull();
  }
});
