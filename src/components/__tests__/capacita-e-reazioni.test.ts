import { readFileSync } from 'node:fs';
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

it('lascia respirare la testa della card invece di spingerla fuori schermo', () => {
  // Misurato con Chrome a 390×844: la scheda era larga 498px, e a spingerla
  // fuori era `.contatore` con dentro «2 · +1 / Riposo Breve · tutti / Riposo
  // Lungo» — 343px di stringa in una riga larga 358. Quel testo l'ha allungato
  // `testoRecupero`; finché il recupero si diceva in due parole, `flex: none`
  // non faceva danni.
  //
  // Da lì nasceva anche la modale della Vitalità larga 498 e alta 1078: il
  // browser allarga il viewport a tutta la pagina, e la modale è `100%` di
  // quello. Un sintomo solo, letto due volte.
  //
  // La guardia è sul CSS perché il gate non ha un browser: se qualcuno
  // rimette `flex: none` sul contatore, la scheda torna a sbordare.
  const sorgente = readFileSync('src/components/CapacitaEReazioni.astro', 'utf8');
  const regola = (selettore: string): string => {
    const apertura = sorgente.indexOf(`${selettore} {`);
    if (apertura === -1) throw new Error(`regola non trovata: ${selettore}`);
    return sorgente.slice(apertura, sorgente.indexOf('}', apertura));
  };

  expect(regola('.testa')).toMatch(/flex-wrap:\s*wrap/);
  expect(regola('.contatore')).not.toMatch(/flex:\s*none/);
  expect(regola('.contatore')).toMatch(/min-width:\s*0/);
});

it('apre una modale per la risorsa che ha più usi, con un posto per comando', async () => {
  const html = await rendi();

  // Gemella della modale di lancio: un blocco per uso invece di un blocco per
  // livello di slot. Il testo è statico, i comandi li disegna l'isola —
  // un'isola non contiene mai contenuto statico.
  expect(html).toContain('id="cap-incanalare"');
  for (const u of pg.risorse.find((r) => r.id === 'incanalare')?.usi ?? []) {
    expect(html).toContain(`data-uso="${u.id}"`);
  }
});

it('dà alle reazioni un posto per il comando, senza modale', async () => {
  const html = await rendi();

  // Si spendono nel turno di qualcun altro e la scelta non esiste: aprire una
  // modale per un bottone solo sarebbe un passaggio in più nel momento
  // sbagliato.
  for (const id of ['ira-tempesta', 'tuono-tempesta']) {
    expect(html).toContain(`data-spendi="${id}"`);
  }
  expect(html).not.toContain('data-spendi="incanalare"');
});
