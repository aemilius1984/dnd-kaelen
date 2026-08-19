import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CarteIncantesimo from '@/components/CarteIncantesimo.astro';
import { caricaIncantesimi } from '@/lib/carica-personaggio';

// Come per gli attacchi: sotto vitest le content collection sono vuote, quindi
// gli incantesimi si leggono da disco con lo stesso schema.
const tutti = caricaIncantesimi();
const con = (slug: string) => {
  const m = tutti.get(slug);
  if (!m) throw new Error(`Incantesimo mancante nel test: ${slug}`);
  return { ...m, slug, testo: 'testo di prova' };
};

const trucchetto = con('fiamma-sacra');
const diLivello = con('cura-ferite');

async function rendi(incantesimi: ReturnType<typeof con>[]): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(CarteIncantesimo, { props: { incantesimi } });
}

describe('la testa della card', () => {
  it('porta sigillo, nome doppio, livello e i dati del lancio', async () => {
    const html = await rendi([diLivello]);

    expect(html).toContain('<use href="#sig-cura-ferite"');
    expect(html).toContain('Cura Ferite');
    expect(html).toContain('Cure Wounds');
    expect(html).toContain(diLivello.lancio);
    expect(html).toContain(diLivello.gittata);
  });

  it('mostra TS e danno solo dove esistono', async () => {
    const conTiro = con('fiamma-sacra');
    const html = await rendi([conTiro]);

    expect(conTiro.tiro).not.toBeNull();
    expect(html).toContain(`TS ${conTiro.tiro}`);
    expect(html).toContain(conTiro.danno!);
  });
});

describe('trucchetti e incantesimi di livello', () => {
  it('un trucchetto si dichiara a volontà e non porta il contenitore di lancio', async () => {
    const html = await rendi([trucchetto]);

    // «a volontà» sta sulla riga della carta, «At Will» dentro la modale: su
    // una riga sola non ci stanno tutt'e due, e il nome inglese serve a chi
    // cerca il termine sul manuale, cioè a chi si è già fermato a leggere.
    expect(html).toContain('a volontà');
    expect(html).toContain('At Will');
    // Nessuno slot da spendere: un contenitore vuoto qui sarebbe un bottone
    // che non comparirà mai.
    expect(html).not.toContain('data-lancio');
  });

  it('un incantesimo di livello porta il contenitore che l’isola cerca', async () => {
    const html = await rendi([diLivello]);

    expect(html).toContain(`data-lancio="${diLivello.slug}"`);
    expect(html).toContain(`data-livello="${diLivello.livello}"`);
    expect(html).not.toContain('a volontà');
  });
});

it('rende una card per incantesimo, una per riga', async () => {
  const html = await rendi([trucchetto, diLivello]);

  expect(html.match(/class="[^"]*superficie/g) ?? []).toHaveLength(2);
});

it('parte nascosto solo ciò che non è preparato, e solo se glielo si chiede', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(CarteIncantesimo, {
    props: { incantesimi: [diLivello], visibiliDiDefault: [] },
  });

  // I 32 incantesimi del pool sono tutti in HTML statico: `hidden` scritto in
  // build è ciò che li tiene fuori dallo schermo senza attendere JavaScript.
  expect(html).toContain('hidden');
  expect(html).toContain(`data-slug="${diLivello.slug}"`);
});

it('il dominio resta visibile anche in un elenco che nasconde i non preparati', async () => {
  // Preparati e dominio erano due chiamate separate del componente proprio per
  // evitare questo: la seconda non riceveva `visibiliDiDefault`, quindi le sue
  // card non si nascondevano. Il prezzo era una cucitura fra due griglie —
  // l'ultima carta della prima toccava la prima della seconda, senza distacco.
  // Ora l'elenco è uno solo e la regola sta qui: chi è del dominio è *sempre
  // preparato*, non occupa uno dei sei posti e non si nasconde mai.
  const container = await AstroContainer.create();
  const html = await container.renderToString(CarteIncantesimo, {
    props: { incantesimi: [con('nube-di-nebbia')], visibiliDiDefault: [] },
  });

  // Il tag di apertura della card, non tutta la pagina: `aria-hidden` sui
  // sigilli farebbe passare un `toContain('hidden')` senza dire niente.
  const apertura = html.match(/<div[^>]*data-carta="nube-di-nebbia"[^>]*>/)?.[0];
  expect(apertura).toBeDefined();
  expect(apertura).not.toMatch(/\shidden/);
  // Nemmeno `data-slug`: è la maniglia con cui ControlliLancio commuta la
  // visibilità, e su una card di dominio non deve esistere presa.
  expect(apertura).not.toContain('data-slug=');
});

describe('tag rituale', () => {
  it('l’etichetta compare su un rituale', async () => {
    const html = await rendi([con('presagio')]);

    // Due volte, e sono due cose diverse: in coda alla riga della carta serve
    // a decidere senza aprire; dentro la modale porta anche il nome inglese.
    expect(html).toContain('· rituale');
    expect(html).toContain('rituale · Ritual');
  });

  it('e non compare su chi rituale non è', async () => {
    // `cura-ferite` è stato controllato sulla lista del Chierico: colonna
    // Special vuota.
    const html = await rendi([diLivello]);

    expect(html).not.toContain('Ritual');
  });
});

it('la carta di dominio non sposta il proprio contenuto', () => {
  // Marcarla con un bordo più spesso la faceva rientrare di due pixel: un
  // bordo partecipa alla scatola, e in un elenco dove l'occhio segue una
  // colonna di icone quelle quattro carte stavano mezzo passo più in là.
  // La marcatura non deve toccare né bordo né imbottitura.
  const sorgente = readFileSync('src/components/CarteIncantesimo.astro', 'utf8');
  const regola = sorgente.slice(
    sorgente.indexOf('.di-dominio {'),
    sorgente.indexOf('}', sorgente.indexOf('.di-dominio .apri-incantesimo {')),
  );

  expect(regola).not.toMatch(/border(-left)?(-width)?:/);
  expect(regola).not.toMatch(/padding/);
  expect(regola).toMatch(/box-shadow:\s*inset/);
});
