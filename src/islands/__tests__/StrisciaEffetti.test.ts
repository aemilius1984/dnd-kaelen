// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, render } from 'preact';
import StrisciaEffetti from '@/islands/StrisciaEffetti';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { muta, stato } from '@/lib/storage';
import { nuovoIdEffetto } from '@/lib/effetti';
import { classeArmatura, cdIncantesimi } from '@/lib/derive';

const pg = caricaPersonaggioDaFile();
const CA = classeArmatura(pg);
const CD = cdIncantesimi(pg);

let radice: HTMLDivElement;
const giro = () => new Promise((r) => setTimeout(r, 50));

const valore = (chiave: string) =>
  document.querySelector<HTMLElement>(`[data-adesso="${chiave}"]`)!.textContent;
const chip = (nome: string) =>
  [...document.querySelectorAll<HTMLElement>('.chip-effetto')].find((c) =>
    c.textContent?.includes(nome),
  );

const effetto = (nome: string, parti = {}) => ({
  id: nuovoIdEffetto(),
  nome,
  durata: '10 minuti',
  concentrazione: false,
  modifiche: [],
  accesoIl: '2026-08-20T10:00:00.000Z',
  ...parti,
});

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    // Il markup come lo scrive `scheda.astro`, ridotto all'osso. I numeri sono
    // quelli che il build stampa: senza JavaScript restano questi, e sono
    // giusti.
    `<div class="difese">` +
    `<div><span class="tenue">CA</span><span class="valore" data-adesso="ca">${CA}</span></div>` +
    `<div><span class="tenue">CD</span><span class="valore" data-adesso="cd">${CD}</span></div>` +
    `<div><span class="tenue">INIZ</span><span class="valore" data-adesso="iniz">+1</span></div>` +
    `</div>` +
    `<p class="tenue attacco-inc">Attacco <span data-adesso="attacco-inc">+5</span> · ` +
    `CD <span data-adesso="cd">${CD}</span></p>` +
    `<div class="striscia-effetti-isola"></div>`;

  muta((x) => ({ ...x, effetti: [], oggettiAggiunti: [], indossati: [], esaurimento: 0 }));

  radice = document.querySelector<HTMLElement>('.striscia-effetti-isola')! as HTMLDivElement;
  render(h(StrisciaEffetti, {}), radice);
  await giro();
});

afterEach(() => render(null, radice));

describe('a effetti spenti la pagina è quella del build', () => {
  it('i numeri restano identici a quelli stampati', () => {
    expect(valore('ca')).toBe(`${CA}`);
    expect(valore('cd')).toBe(`${CD}`);
  });

  it('non c’è nessun valore barrato da leggere', () => {
    expect(document.querySelector('.difese s')).toBeNull();
  });

  it('resta il solo «+»', () => {
    expect(document.querySelectorAll('.chip-effetto')).toHaveLength(0);
    expect(document.querySelector('.chip-aggiungi')).not.toBeNull();
  });
});

describe('un effetto che sposta un numero', () => {
  beforeEach(async () => {
    muta((x) => ({
      ...x,
      effetti: [
        effetto('Scudo della Fede', {
          concentrazione: true,
          modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 2 }],
        }),
      ],
    }));
    await giro();
  });

  it('la CA in pagina sale', () => {
    expect(valore('ca')).toContain(`${CA + 2}`);
  });

  it('il valore di base resta leggibile, barrato', () => {
    expect(document.querySelector('.difese s')?.textContent).toBe(`${CA}`);
  });

  it('gli altri numeri non si muovono e non si barrano', () => {
    expect(valore('cd')).toBe(`${CD}`);
    expect(document.querySelectorAll('.difese s')).toHaveLength(1);
  });

  it('il chip c’è, e dice che è concentrazione', () => {
    expect(chip('Scudo della Fede')).not.toBeUndefined();
    expect(chip('Scudo della Fede')!.classList.contains('concentrazione')).toBe(true);
  });
});

describe('la Saggezza cambia la CD in tutt’e due i posti', () => {
  it('la fascia e la barra appiccicata dicono lo stesso numero', async () => {
    // Lasciarne uno fuori significherebbe due numeri stantii nel punto della
    // pagina che si guarda mentre si sceglie cosa lanciare.
    muta((x) => ({
      ...x,
      effetti: [
        effetto('Dono', { modifiche: [{ genere: 'punteggio', bersaglio: 'sag', valore: 20 }] }),
      ],
    }));
    await giro();

    const tutti = [...document.querySelectorAll<HTMLElement>('[data-adesso="cd"]')];
    expect(tutti).toHaveLength(2);
    for (const nodo of tutti) expect(nodo.textContent).toContain(`${CD + 2}`);
  });
});

describe('spegnere', () => {
  it('il × sul chip toglie l’effetto e riporta il numero', async () => {
    muta((x) => ({
      ...x,
      effetti: [
        effetto('Scudo della Fede', {
          modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 2 }],
        }),
      ],
    }));
    await giro();

    chip('Scudo della Fede')!.querySelector<HTMLButtonElement>('button.spegni')!.click();
    await giro();

    expect(stato.value.effetti).toEqual([]);
    expect(valore('ca')).toBe(`${CA}`);
  });

  it('non passa dalla striscia Annulla: si annulla da sé', async () => {
    // Una striscia che copre lo schermo per una cosa che si disfa toccando il
    // × accanto è rumore.
    const { annullabile } = await import('@/lib/annulla');
    annullabile.value = null;
    muta((x) => ({ ...x, effetti: [effetto('Santuario')] }));
    await giro();
    chip('Santuario')!.querySelector<HTMLButtonElement>('button.spegni')!.click();
    await giro();
    expect(annullabile.value).toBeNull();
  });
});

describe('esaurimento', () => {
  it('a zero non ha un chip', async () => {
    expect(chip('Esaurimento')).toBeUndefined();
  });

  it('acceso, mostra il livello e dice in parole quel che nessun numero porta', async () => {
    muta((x) => ({ ...x, esaurimento: 2 }));
    await giro();
    expect(chip('Esaurimento')!.textContent).toContain('2');
    expect(document.querySelector('.promemoria-voci')!.textContent).toContain('−4 alle prove');
    expect(document.querySelector('.promemoria-voci')!.textContent).toContain('−10 ft');
  });

  it('l’iniziativa invece un portale ce l’ha, e scende', async () => {
    muta((x) => ({ ...x, esaurimento: 1 }));
    await giro();
    expect(valore('iniz')).toContain('-1');
  });

  it('si alza dalla modale: il riposo lungo lo abbassa, ma qualcosa deve alzarlo', async () => {
    const dialogo = document.querySelector('dialog.modulo-effetto') as HTMLDialogElement;
    Object.assign(dialogo, {
      showModal: () => dialogo.setAttribute('open', ''),
      close: () => dialogo.removeAttribute('open'),
    });
    document.querySelector<HTMLButtonElement>('.chip-aggiungi')!.click();
    await giro();

    document
      .querySelector<HTMLButtonElement>(
        '.esaurimento-passi button[aria-label="Un livello in più"]',
      )!
      .click();
    await giro();

    expect(stato.value.esaurimento).toBe(1);
    // E non finisce fra gli effetti: ha regole sue.
    expect(stato.value.effetti).toEqual([]);
  });

  it('il × sul suo chip toglie un livello, non lo azzera', async () => {
    muta((x) => ({ ...x, esaurimento: 3 }));
    await giro();
    chip('Esaurimento')!.querySelector<HTMLButtonElement>('button.spegni')!.click();
    await giro();
    expect(stato.value.esaurimento).toBe(2);
  });
});

describe('accendere dalla striscia', () => {
  const apri = async () => {
    const dialogo = document.querySelector('dialog.modulo-effetto') as HTMLDialogElement;
    Object.assign(dialogo, {
      showModal: () => dialogo.setAttribute('open', ''),
      close: () => dialogo.removeAttribute('open'),
    });
    document.querySelector<HTMLButtonElement>('.chip-aggiungi')!.click();
    await giro();
    return dialogo;
  };

  const scrivi = (selettore: string, testo: string) => {
    const campo = document.querySelector<HTMLInputElement>(selettore)!;
    campo.value = testo;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('nome e durata bastano per accendere', async () => {
    const dialogo = await apri();
    scrivi('input[name="nome"]', 'Avvelenato');
    scrivi('input[name="durata"]', 'finché non finisce');
    dialogo
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();

    expect(stato.value.effetti.map((e) => e.nome)).toEqual(['Avvelenato']);
  });

  it('senza nome non accende niente', async () => {
    const dialogo = await apri();
    dialogo
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();
    expect(stato.value.effetti).toEqual([]);
  });

  it('dice chi si spegne, prima di accendere', async () => {
    muta((x) => ({ ...x, effetti: [effetto('Benedizione', { concentrazione: true })] }));
    await giro();
    await apri();
    const casella = document.querySelector<HTMLInputElement>('input[name="concentrazione"]')!;
    casella.checked = true;
    casella.dispatchEvent(new Event('change', { bubbles: true }));
    await giro();

    expect(document.querySelector('.avviso-concentrazione')!.textContent).toContain('Benedizione');
  });
});

describe('un oggetto magico addosso si vede, e non solo nel numero', () => {
  // Al primo giro col telefono la CA passava a 20 col 18 barrato accanto e
  // niente diceva perché: gli oggetti indossati muovevano i numeri senza
  // comparire nella striscia. Un numero che cambia senza una causa visibile è
  // un numero di cui al tavolo non ci si fida.
  const anello = {
    id: 'mio:1',
    nome: 'Anello di protezione',
    quantita: 1,
    consumabile: false,
    modifiche: [{ genere: 'voce' as const, bersaglio: 'ca' as const, valore: 2 }],
  };

  it('ha il suo chip, e dice «addosso»', async () => {
    muta((x) => ({ ...x, oggettiAggiunti: [anello], indossati: ['mio:1'] }));
    await giro();
    expect(chip('Anello di protezione')?.textContent).toContain('addosso');
    expect(valore('ca')).toBe(`${CA + 2}${CA}`);
  });

  it('nello zaino non compare, e non muove niente', async () => {
    muta((x) => ({ ...x, oggettiAggiunti: [anello], indossati: [] }));
    await giro();
    expect(chip('Anello di protezione')).toBeUndefined();
    expect(valore('ca')).toBe(`${CA}`);
  });

  it('un oggetto che non sposta numeri non affolla la striscia', async () => {
    // La striscia risponde a una domanda sola: perché quel numero non è quello
    // stampato. Una corda addosso non la risponde.
    muta((x) => ({
      ...x,
      oggettiAggiunti: [{ ...anello, nome: 'Corda', modifiche: [] }],
      indossati: ['mio:1'],
    }));
    await giro();
    expect(chip('Corda')).toBeUndefined();
  });

  it('la × lo sfila senza buttarlo via', async () => {
    muta((x) => ({ ...x, oggettiAggiunti: [anello], indossati: ['mio:1'] }));
    await giro();
    document.querySelector<HTMLButtonElement>('[data-sfila="mio:1"]')!.click();
    await giro();
    expect(stato.value.indossati).toEqual([]);
    expect(stato.value.oggettiAggiunti).toHaveLength(1);
    expect(valore('ca')).toBe(`${CA}`);
  });
});
