import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import Attacchi from '@/components/Attacchi.astro';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { cdContrasto, classeArmatura } from '@/lib/derive';

// `caricaScheda()` non è utilizzabile qui: sotto vitest le content collection
// sono vuote (vedi il commento in `src/pages/__tests__/scheda.test.ts`).
// `caricaPersonaggioDaFile` legge lo stesso frontmatter da disco e lo valida
// con lo stesso schema — è la via che usano già tutti gli altri test.
const pg = caricaPersonaggioDaFile();

async function rendi(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Attacchi, { props: { pg } });
}

/** Le armi sono i modi raccolti per `gruppo`: chi non ne ha sta da solo. */
const armi = new Set(pg.attacchi.map((a) => a.gruppo ?? a.id));

it('rende una card per arma, non una per modo', async () => {
  // Il titolo diceva già «una card per arma» quando invece ne faceva una per
  // attacco: il maglio ne occupava due, e la conseguenza che conta — lo scudo,
  // quindi la CA — restava fuori da entrambe.
  const html = await rendi();

  expect(html).not.toContain('<table');
  expect(html.match(/class="[^"]*superficie/g) ?? []).toHaveLength(armi.size);
  expect(armi.size).toBeLessThan(pg.attacchi.length);
});

it('sulla carta resta il minimo che serve mentre tiri', async () => {
  // Nome, numero, danno. La prosa, la gittata e le proprietà si aprono: sulla
  // carta erano la parte che al tavolo non si legge mai.
  const html = await rendi();
  const carte = html.slice(0, html.indexOf('<dialog'));

  expect(carte).toContain('Maglio da guerra');
  expect(carte).toContain('1d8 + 3');
  for (const a of pg.attacchi) expect(carte).not.toContain(a.descrizione);
});

it('offre un modo per ogni scelta dell’arma', async () => {
  const html = await rendi();

  for (const etichetta of ['una mano', 'due mani', 'colpisci', 'afferra', 'spingi']) {
    expect(html).toContain(`>${etichetta}<`);
  }
});

it('mostra il tiro come totale, come dado e come scomposizione', async () => {
  // I tre modi restano tutti, ma solo il totale è sulla carta: gli altri due
  // servono a dettarlo e a rispondere al DM, non a decidere.
  const html = await rendi();

  expect(html).toContain('+5');
  expect(html).toContain('1d20+5');
  expect(html).toContain('FOR');
  expect(html).toContain('competenza');
});

it('porta il nome inglese di ogni arma', async () => {
  const html = await rendi();

  for (const a of pg.attacchi) expect(html).toContain(a.nomeEn);
});

it('mostra danno, tipo di danno e gittata di ogni attacco', async () => {
  const html = await rendi();

  // Il colpo senz'armi non ha dado: `dannoTesto` dà «4», che senza il tipo di
  // danno accanto non dice niente.
  expect(html).toContain('1d8 + 3');
  expect(html).toContain('1d10 + 3');
  expect(html).toContain('contundenti');
  expect(html).toContain('5 ft');
});

it('mostra le proprietà una volta sola, nella modale', async () => {
  // Prima comparivano due volte perché il maglio occupava due card. Ora l'arma
  // è una, e le proprietà stanno fra i riferimenti in cima alla modale.
  const html = await rendi();

  expect(html.match(/Versatile \(1d10\)/g) ?? []).toHaveLength(1);
});

it('non offre la Maestria che Kaelen non ha', async () => {
  // L'audit dice che Push non deve comparire *come effetto applicabile*:
  // Protettore dà la competenza nell'arma, non Weapon Mastery. Nominarla per
  // dire che non si applica è un'altra cosa, e serve — chi cerca il Warhammer
  // sul manuale la trova elencata e si chiede perché qui non c'è.
  //
  // Quindi: mai fra le proprietà, mai come scelta; solo dentro le avvertenze,
  // e solo negata.
  const html = await rendi();

  for (const riferimenti of html.match(/class="riferimenti"[^>]*>([^<]*)</g) ?? []) {
    expect(riferimenti).not.toMatch(/\bPush\b/i);
  }
  expect(html).not.toMatch(/class="kicker"[^>]*>[^<]*Push/i);

  const nominata = html.match(/[^.]*\bPush\b[^.]*\./gi) ?? [];
  expect(nominata).toHaveLength(1);
  expect(nominata[0]).toMatch(/non si applica/);
});

it('porta afferrare e spingere con la CD derivata', async () => {
  const html = await rendi();

  expect(html).toContain(`CD ${cdContrasto(pg)}`);
  expect(html).toContain('Forza o Destrezza');
  expect(html).toContain('Prono');
});

it('dice la CA di ogni impugnatura, derivandola', async () => {
  // Il legame fra impugnatura e CA è il motivo per cui il maglio è una carta
  // sola. I due numeri non sono scritti nei dati: vengono dal booleano
  // `scudo` passato a `classeArmatura`.
  const html = await rendi();

  expect(html).toContain(`CA ${classeArmatura(pg, true)}`);
  expect(html).toContain(`CA ${classeArmatura(pg, false)}`);
  expect(classeArmatura(pg, true)).not.toBe(classeArmatura(pg, false));
});

it('apre una modale per arma, e nessuna resta aperta in pagina', async () => {
  const html = await rendi();

  expect(html.match(/<dialog/g) ?? []).toHaveLength(armi.size);
  expect(html).not.toMatch(/<dialog[^>]*\bopen\b/);
});
