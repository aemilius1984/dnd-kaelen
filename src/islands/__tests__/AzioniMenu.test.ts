// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { h, render } from 'preact';
import AzioniMenu from '@/islands/AzioniMenu';

let radice: HTMLDivElement;

beforeEach(() => {
  document.body.innerHTML = '';
  radice = document.createElement('div');
  document.body.append(radice);
});

it('offre solo l azzeramento, senza commutare il tema', () => {
  render(h(AzioniMenu, {}), radice);
  const etichette = [...radice.querySelectorAll('button')].map((b) => b.textContent ?? '');

  expect(etichette).toEqual(['Azzera sessione']);
});
