// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import Rotella from '@/islands/Rotella';
import { MASSIMO, MINIMO, PASSO } from '@/lib/rotella';

let radice: HTMLDivElement;
let letto: number[];

const giro = () => new Promise((r) => setTimeout(r, 50));
const pista = () => radice.querySelector<HTMLElement>('.pista')!;

const monta = (valore: number) => {
  letto = [];
  render(h(Rotella, { valore, onCambia: (n: number) => letto.push(n) }), radice);
};

beforeEach(() => {
  radice = document.createElement('div');
  document.body.append(radice);
});

afterEach(() => {
  render(null, radice);
  radice.remove();
});

it('offre una cifra per ogni numero dell’intervallo', async () => {
  monta(4);
  await giro();

  expect(radice.querySelectorAll('.cifra')).toHaveLength(MASSIMO - MINIMO + 1);
});

it('si annuncia come selettore di numero, non come lista', async () => {
  // Chi usa un lettore di schermo non può girare niente: senza questo ruolo
  // sentirebbe trentuno numeri sciolti e nessun valore corrente.
  monta(4);
  await giro();

  expect(pista().getAttribute('role')).toBe('spinbutton');
  expect(pista().getAttribute('aria-valuenow')).toBe('4');
  expect(pista().getAttribute('aria-valuemin')).toBe(String(MINIMO));
  expect(pista().getAttribute('aria-valuemax')).toBe(String(MASSIMO));
});

it('scorrere la pista riporta il numero sotto la banda', async () => {
  monta(4);
  await giro();

  pista().scrollTop = PASSO * 9;
  pista().dispatchEvent(new Event('scroll'));
  await giro();

  expect(letto).toContain(9);
});

it('le frecce girano la rotella di una cifra per volta', async () => {
  // La strada da tastiera. Senza, la rotella è un comando che esiste solo
  // per chi ha un dito.
  monta(4);
  await giro();

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await giro();
  expect(letto).toContain(5);

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await giro();
  expect(letto).toContain(3);
});

it('non scavalca gli estremi', async () => {
  monta(MINIMO);
  await giro();

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await giro();

  expect(letto).not.toContain(MINIMO - 1);
});

it('non richiama onCambia se il numero non è cambiato', async () => {
  // `scrollTop` scritto da noi fa scattare un evento `scroll`: senza questa
  // guardia il componente si richiama da solo a ogni riposizionamento.
  monta(4);
  await giro();
  const prima = letto.length;

  pista().scrollTop = PASSO * 4;
  pista().dispatchEvent(new Event('scroll'));
  await giro();

  expect(letto).toHaveLength(prima);
});

it('accetta un intervallo diverso, per il d20 del tiro contro morte', async () => {
  // Una rotella sola per due scopi: la quantità di PF e il dado. Un controllo
  // nuovo sarebbe un gesto in più da imparare proprio nel momento peggiore.
  letto = [];
  render(
    h(Rotella, { valore: 10, minimo: 1, massimo: 20, onCambia: (n: number) => letto.push(n) }),
    radice,
  );
  await giro();

  expect(radice.querySelectorAll('.cifra')).toHaveLength(20);
  expect(pista().getAttribute('aria-valuemin')).toBe('1');
  expect(pista().getAttribute('aria-valuemax')).toBe('20');

  pista().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await giro();
  expect(letto).toContain(11);
});
