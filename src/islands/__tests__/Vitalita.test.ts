// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import Vitalita from '@/islands/Vitalita';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { applicaDanno, impostaPfTemporanei, statoIniziale } from '@/lib/sheet-state';
import { muta } from '@/lib/storage';

const pg = caricaPersonaggioDaFile();

let radice: HTMLDivElement;
const giro = () => new Promise((r) => setTimeout(r, 50));
const scheda = () => radice.querySelector<HTMLElement>('.vitalita-scheda')!;
const finestra = () => radice.querySelector<HTMLDialogElement>('dialog.vitalita')!;

beforeEach(async () => {
  localStorage.clear();
  // jsdom non implementa il dialogo modale: qui serve solo sapere che
  // qualcuno l'ha aperto, non vederlo aperto.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>`;
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Vitalita, {}), radice);
  // `stato` è un signal di modulo e `assicuraInizializzato` gira una volta
  // sola: senza questo ogni prova eredita i PF della precedente.
  muta(() => statoIniziale(pg, 'v-test'));
  await giro();
});

afterEach(() => {
  render(null, radice);
});

it('il riepilogo mostra i PF correnti sul massimo', async () => {
  expect(scheda().textContent).toContain(String(pg.pfMax));
});

it('il riepilogo è un bersaglio solo, non una manciata di righe', async () => {
  // Tutta la scheda apre: al tavolo si colpisce il blocco, non un link.
  expect(scheda().tagName).toBe('BUTTON');
});

it('toccare il riepilogo apre la modale', async () => {
  expect(finestra().open).toBe(false);

  scheda().click();
  await giro();

  expect(finestra().open).toBe(true);
});

it('il riepilogo segue lo stato quando cambia da fuori', async () => {
  muta((x) => applicaDanno(x, pg, 5));
  await giro();

  expect(scheda().textContent).toContain(String(pg.pfMax - 5));
});

it('il chip dei temporanei tiene il suo posto anche a zero', async () => {
  // L'altezza della scheda è fissa e riservata: se il chip sparisse dal
  // flusso quando i temporanei sono zero, la riga si accorcerebbe e il
  // contenuto sotto salterebbe.
  const aZero = radice.querySelector('.vitalita-temp')!;
  expect(aZero).not.toBeNull();

  muta((x) => impostaPfTemporanei(x, 4));
  await giro();

  expect(radice.querySelector('.vitalita-temp')!.textContent).toContain('4');
});

const verbo = (nome: string) => radice.querySelector<HTMLButtonElement>(`.verbo-${nome}`)!;
const digita = () => radice.querySelector<HTMLInputElement>('.digita')!;

const scegli = async (n: number) => {
  digita().value = String(n);
  digita().dispatchEvent(new Event('input', { bubbles: true }));
  await giro();
};

it('il danno toglie esattamente la quantità scelta', async () => {
  await scegli(5);
  verbo('danno').click();
  await giro();

  expect(scheda().textContent).toContain(String(pg.pfMax - 5));
});

it('la cura non porta oltre il massimo', async () => {
  muta((x) => applicaDanno(x, pg, 3));
  await scegli(30);
  verbo('cura').click();
  await giro();

  expect(scheda().textContent).toContain(String(pg.pfMax));
});

it('i temporanei si impostano, non si sommano', async () => {
  await scegli(7);
  verbo('temp').click();
  await giro();
  await scegli(2);
  verbo('temp').click();
  await giro();

  expect(radice.querySelector('.vitalita-temp')!.textContent).toContain('2');
});

it('ogni verbo dice cosa farà con la quantità corrente', async () => {
  // Due tempi: prima il numero, poi il verbo. Se il verbo non ripete il
  // numero, il secondo tempo si fa alla cieca.
  await scegli(6);

  expect(verbo('danno').textContent).toContain('6');
  expect(verbo('cura').textContent).toContain('6');
});

it('l’esito finisce in una regione annunciata', async () => {
  // Chi non vede il numero cambiare deve sentire che è successo qualcosa.
  await scegli(4);
  verbo('danno').click();
  await giro();

  const annuncio = radice.querySelector('[aria-live]')!;
  expect(annuncio.textContent).toContain(String(pg.pfMax - 4));
});
