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
const quantita = () => Number(radice.querySelector('.pista')!.getAttribute('aria-valuenow'));

/** Porta la rotella sul numero voluto. Non c'è più un campo da riempire: si
 *  arriva a passi, che è anche la strada vera di chi usa la modale. */
const scegli = async (n: number) => {
  for (let i = 0; i < 64 && quantita() !== n; i++) {
    radice
      .querySelector<HTMLButtonElement>(quantita() < n ? '.freccia-su' : '.freccia-giu')!
      .click();
    await giro();
  }
  // Se le frecce si fermassero prima, i test qui sotto proverebbero il numero
  // sbagliato e passerebbero lo stesso.
  expect(quantita()).toBe(n);
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

const comando = (riga: string) => radice.querySelector<HTMLButtonElement>(`.riga-${riga} button`)!;

const aTerra = async () => {
  muta((x) => applicaDanno(x, pg, pg.pfMax));
  await giro();
};

it('spendere un dado vita lo scala e cura del totale scelto', async () => {
  muta((x) => applicaDanno(x, pg, 6));
  await giro();
  await scegli(4);

  comando('dadi').click();
  await giro();

  expect(scheda().textContent).toContain(`${pg.numeroDadiVita - 1}/${pg.numeroDadiVita}`);
  expect(scheda().textContent).toContain(String(pg.pfMax - 2));
});

it('l’Ispirazione si prende quando è spenta e si spende quando è accesa', async () => {
  // Era una stella da guardare: in una modale che serve ad agire, una riga
  // di sola lettura è un buco.
  expect(comando('isp').textContent).toMatch(/prendi/i);

  comando('isp').click();
  await giro();
  expect(comando('isp').textContent).toMatch(/spendi/i);

  comando('isp').click();
  await giro();
  expect(comando('isp').textContent).toMatch(/prendi/i);
});

it('i TS contro morte compaiono solo quando si è a terra', async () => {
  expect(radice.querySelector('.riga-ts')).toBeNull();

  await aTerra();

  expect(radice.querySelector('.riga-ts')).not.toBeNull();
});

it('a terra la rotella diventa il d20, e il bottone dice con che numero tira', async () => {
  await aTerra();

  const pista = radice.querySelector('.pista')!;
  expect(pista.getAttribute('aria-valuemin')).toBe('1');
  expect(pista.getAttribute('aria-valuemax')).toBe('20');
  expect(comando('ts').textContent).toMatch(/tira/i);
});

it('un tiro da 10 in su segna un successo', async () => {
  await aTerra();
  await scegli(15);

  comando('ts').click();
  await giro();

  expect(radice.querySelector('.riga-ts')!.textContent).toContain('1');
});

it('un 20 naturale rimette Kaelen in piedi e chiude i TS', async () => {
  // È la ragione per cui il tiro passa il d20 grezzo invece dell’esito.
  await aTerra();
  await scegli(20);

  comando('ts').click();
  await giro();

  expect(radice.querySelector('.riga-ts')).toBeNull();
  expect(scheda().textContent).toContain('1');
});

const dialogo = () => radice.querySelector<HTMLDialogElement>('dialog.vitalita')!;

it('la modale mostra i PF: è a tutto schermo e copre il riepilogo', async () => {
  // Il difetto per cui questa modale «non funzionava»: si apriva sopra la
  // scheda, quindi il numero che stavi cambiando non era più visibile da
  // nessuna parte. Un pannello di comando senza quadrante.
  muta((x) => applicaDanno(x, pg, 6));
  await giro();

  expect(dialogo().querySelector('.stato')).not.toBeNull();
  expect(dialogo().querySelector('.stato')!.textContent).toContain(String(pg.pfMax - 6));
  expect(dialogo().querySelector('.stato')!.textContent).toContain(String(pg.pfMax));
});

it('e il metro dentro la modale segue i PF', async () => {
  muta((x) => applicaDanno(x, pg, pg.pfMax));
  await giro();

  const riempimento = dialogo().querySelector<HTMLElement>('.stato .riempimento')!;
  expect(riempimento.style.width).toBe('0%');
});

it('applicare un danno dalla modale si vede nella modale', async () => {
  // La prova che lega le due cose: prima i verbi cambiavano uno stato che
  // solo la pagina dietro sapeva mostrare.
  await scegli(4);
  verbo('danno').click();
  await giro();

  expect(dialogo().querySelector('.stato')!.textContent).toContain(String(pg.pfMax - 4));
});

it('i PF temporanei si vedono nella modale, non solo nel riepilogo', async () => {
  await scegli(5);
  verbo('temp').click();
  await giro();

  expect(dialogo().querySelector('.stato')!.textContent).toContain('5');
});

it('l’annuncio di un gesto senza quantità non recita uno zero', async () => {
  // «Ispirazione presa 0. 21 punti ferita.» Lo zero era il parametro della
  // quantità, che per l'Ispirazione non esiste: il modello era una frase sola
  // per gesti che non hanno la stessa forma.
  comando('isp').click();
  await giro();

  const annuncio = radice.querySelector('[aria-live]')!;
  expect(annuncio.textContent).not.toMatch(/\s0\./);
  expect(annuncio.textContent).toMatch(/ispirazione/i);
});

it('il comando dei dadi vita dice di quanto cura', async () => {
  // Come «Tira 15» per i TS: il secondo tempo non si fa alla cieca.
  muta((x) => applicaDanno(x, pg, 6));
  await giro();
  await scegli(5);

  expect(comando('dadi').textContent).toContain('5');
});

it('la modale dice in che stato è Kaelen, non solo quanti PF ha', async () => {
  // La macchina a stati ne ha quattro e a zero PF i punti ferita valgono zero
  // in tre di essi: senza una riga che lo dica, «stabile» e «morto» sono
  // indistinguibili da «sta tirando».
  const stato = () => dialogo().querySelector('.stato-vitale')!;
  expect(stato().textContent).toMatch(/cosciente/i);

  await aTerra();
  expect(stato().textContent).toMatch(/incosciente/i);

  for (let i = 0; i < 3; i++) {
    await scegli(15);
    comando('ts').click();
    await giro();
  }
  expect(stato().textContent).toMatch(/stabile/i);
});

it('cambiando intervallo la quantità entra nel nuovo intervallo', async () => {
  // A terra la rotella diventa 1–20. Se `quanto` era 0 restava 0: fuori
  // scala, nessuna cifra evidenziata, e `aria-valuenow` fuori dai limiti
  // dichiarati.
  await scegli(0);
  await aTerra();

  const pista = radice.querySelector('.pista')!;
  expect(Number(pista.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(1);
  expect(comando('ts').textContent).not.toMatch(/\b0\b/);
});
