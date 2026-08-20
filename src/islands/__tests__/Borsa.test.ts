// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, render } from 'preact';
import Borsa from '@/islands/Borsa';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { muta, stato } from '@/lib/storage';
import { classeArmatura } from '@/lib/derive';

const pg = caricaPersonaggioDaFile();
let radice: HTMLDivElement;
const giro = () => new Promise((r) => setTimeout(r, 50));

const gruppo = (nome: string) => document.querySelector<HTMLElement>(`[data-gruppo="${nome}"]`)!;

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>`;
  muta((x) => ({
    ...x,
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    oggettiAggiunti: [],
    indossati: [],
    effetti: [],
    esaurimento: 0,
  }));
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Borsa, {}), radice);
  await giro();
});

afterEach(() => render(null, radice));

describe('tre gruppi al posto di un elenco piatto', () => {
  it('addosso ci sono armatura, scudo, arma e focus', () => {
    const testo = gruppo('addosso').textContent!;
    for (const nome of ['Cotta di maglia', 'Scudo', 'Maglio da guerra', 'Simbolo sacro']) {
      expect(testo).toContain(nome);
    }
  });

  it('i consumabili stanno nel loro gruppo, non fra quelli addosso', () => {
    expect(gruppo('consumabili').textContent).toContain('Razioni');
    expect(gruppo('addosso').textContent).not.toContain('Razioni');
  });

  it('lo zaino è chiuso di default e raccoglie tutto il resto', () => {
    const zaino = document.querySelector<HTMLDetailsElement>('details[data-gruppo="zaino"]')!;
    expect(zaino.open).toBe(false);
    expect(zaino.textContent).toContain('Corda da 50 ft');
  });

  it('le monete stanno in fondo: si toccano a fine sessione, non durante', () => {
    const monete = document.querySelector('.monete')!;
    expect(
      gruppo('addosso').compareDocumentPosition(monete) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('il sommario di quel che porti addosso', () => {
  it('a mani nude dice la CA e basta', () => {
    expect(document.querySelector('.sommario-addosso')!.textContent).toContain(
      `CA ${classeArmatura(pg)}`,
    );
  });

  it('un oggetto indossato ci compare, ed è lì che un doppio conteggio si vede', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        {
          id: 'mio:1',
          nome: 'Cintura di Forza',
          quantita: 1,
          consumabile: false,
          modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
        },
      ],
      indossati: ['mio:1'],
    }));
    await giro();
    expect(document.querySelector('.sommario-addosso')!.textContent).toContain('FOR 20');
  });
});

describe('indossare e togliere', () => {
  it('un oggetto aggiunto si indossa da qui', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Scudo +1', quantita: 1, consumabile: false, modifiche: [] },
      ],
    }));
    await giro();
    document.querySelector<HTMLButtonElement>('[data-indossa="mio:1"]')!.click();
    await giro();
    expect(stato.value.indossati).toEqual(['mio:1']);
  });

  it('un oggetto del repo non si indossa: pg.armatura lo dice già', async () => {
    // Cotta di maglia e scudo stanno già in `pg.armatura`, e `classeArmatura`
    // li conta. Un interruttore qui li conterebbe due volte.
    expect(document.querySelector('[data-indossa="scudo"]')).toBeNull();
  });

  it('un oggetto aggiunto si può togliere di mezzo del tutto', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Corda marcia', quantita: 1, consumabile: false, modifiche: [] },
      ],
    }));
    await giro();
    document.querySelector<HTMLButtonElement>('[data-rimuovi="mio:1"]')!.click();
    await giro();
    expect(stato.value.oggettiAggiunti).toEqual([]);
  });
});
