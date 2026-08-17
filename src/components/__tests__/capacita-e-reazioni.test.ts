import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import CapacitaEReazioni from '@/components/CapacitaEReazioni.astro';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { fondiCapacita } from '@/lib/capacita';

const pg = caricaPersonaggioDaFile();

async function rendi(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CapacitaEReazioni, { props: { pg } });
}

it('nomina Ira della Tempesta una volta sola', async () => {
  const html = await rendi();

  // Il difetto che questo task esiste per chiudere: la stessa capacità
  // compariva come contatore in una sezione e come innesco in un'altra.
  expect(html.match(/Ira della Tempesta/g) ?? []).toHaveLength(1);
  expect(html.match(/Tuono della Tempesta/g) ?? []).toHaveLength(1);
});

it('rende una card per capacità fusa', async () => {
  const html = await rendi();

  expect(html.match(/class="[^"]*superficie/g) ?? []).toHaveLength(fondiCapacita(pg).length);
});

it('mette il contenitore delle caselle solo dove c’è un contatore', async () => {
  const html = await rendi();

  for (const r of pg.risorse) expect(html).toContain(`data-caselle="${r.id}"`);
  // L'Attacco di Opportunità non ha usi da contare: una fila di caselle lì
  // direbbe una cosa falsa.
  expect(html.match(/data-caselle/g) ?? []).toHaveLength(pg.risorse.length);
});

it('mostra innesco ed effetto separati dove la capacità è anche una reazione', async () => {
  const html = await rendi();

  expect(html).toContain('Quando');
  expect(html).toContain('Effetto');
  const ira = pg.reazioni.find((r) => r.nome === 'Ira della Tempesta')!;
  expect(html).toContain(ira.innesco);
});

it('elenca dentro Incanalare Divinità i suoi tre usi', async () => {
  const html = await rendi();

  expect(html).toContain('Scintilla Divina');
  expect(html).toContain('Scacciare Non Morti');
  expect(html).toContain('Ira Distruttiva');
  // Il prefisso è tolto: dentro la card di Incanalare Divinità ripeterlo tre
  // volte è rumore.
  expect(html).not.toContain('Incanalare Divinità: Scintilla Divina');
});

it('dice quando ogni contatore torna pieno', async () => {
  const html = await rendi();

  expect(html).toContain('Riposo Breve');
  expect(html).toContain('Riposo Lungo');
});

it('porta il nome inglese di ogni capacità', async () => {
  // `Storm's Thunder` esce dall'HTML con l'apostrofo come entità: senza
  // scioglierla il test cercherebbe una stringa che non c'è e passerebbe solo
  // per i nomi senza apostrofo, cioè quasi tutti.
  const html = (await rendi()).replaceAll('&#39;', "'").replaceAll('&amp;', '&');

  for (const c of fondiCapacita(pg)) expect(html).toContain(c.nomeEn);
});
