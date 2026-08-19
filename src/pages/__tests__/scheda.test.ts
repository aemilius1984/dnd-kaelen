import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Perché queste asserzioni girano sul costruito e non sulla container API.
 *
 *  Il piano chiedeva di rendere `scheda.astro` con `experimental_AstroContainer`.
 *  Il container ci arriva — con il renderer di Preact registrato rende la pagina
 *  intera, isole comprese — ma **le content collection restano vuote**: sotto
 *  vitest `getCollection('character')` torna `[]`, e la pagina muore su «Scheda
 *  di Kaelen non trovata» prima di produrre una riga di HTML. Lo store che
 *  `astro build` scrive (`node_modules/.astro/data-store.json`) non viene letto
 *  dal runtime di test.
 *
 *  Le alternative erano indebolire l'asserzione — verificare il componente
 *  invece della pagina — oppure spostarla sul costruito, che è la cosa vera che
 *  arriva al browser. La seconda. Il prezzo è che `npm run gate` ora costruisce
 *  *prima* di testare, invece che dopo: senza quell'ordine questi test
 *  leggerebbero il `dist/` della corsa precedente e passerebbero su codice
 *  vecchio. */
const dist = (rotta: string): string => {
  const percorso = `dist/${rotta}/index.html`;
  if (!existsSync(percorso)) {
    throw new Error(
      `${percorso} non esiste. Questi test leggono il costruito: lancia \`npm run build\` ` +
        `(o \`npm run gate\`, che ora costruisce prima di testare).`,
    );
  }
  return readFileSync(percorso, 'utf8');
};

describe('le sezioni non stanno più dentro un riquadro', () => {
  it('nessuna pagina costruita porta ancora la classe pannello', () => {
    // Il contenitore marca l'unità con cui interagisci, mai l'argomento: è la
    // regola che questo ridisegno esiste per applicare.
    for (const rotta of ['scheda', 'personaggio', 'preparati', 'note']) {
      expect(dist(rotta)).not.toContain('class="pannello"');
    }
  });

  it('ogni sezione della scheda ha una testata al posto del riquadro', () => {
    const html = dist('scheda');

    for (const kicker of ['in combattimento', 'magia', 'cosa puoi spendere']) {
      expect(html).toContain(kicker);
    }
  });

  it('gli slot non hanno più una sezione in fondo: stanno in cima alla magia', () => {
    // «Quel che si consuma» era una sezione a parte, in fondo alla pagina —
    // cioè lontano dal punto in cui si decide di spendere. Adesso gli slot
    // sono una barra appiccicata in cima alla sezione degli incantesimi, e
    // restano davanti mentre la si scorre.
    const html = dist('scheda');

    expect(html).not.toContain('quel che si consuma');
    expect(html).toContain('class="barra-slot-isola"');
  });
});

// Un `nomeEn` nei dati che nessuna pagina rende è lavoro sprecato che sembra
// fatto: senza queste asserzioni il passo è invisibile al gate.
describe('i nomi inglesi arrivano fino alla pagina', () => {
  it('la scheda nomina le reazioni in doppia lingua', () => {
    const html = dist('scheda');

    expect(html).toContain('Wrath of the Storm');
    expect(html).toContain('Opportunity Attack');
  });

  it('non nomina due volte una capacità che è anche una reazione', () => {
    // Prima del task 6 «Ira della Tempesta» compariva come contatore in una
    // sezione e come innesco in un'altra, senza niente che dicesse che erano
    // la stessa cosa.
    const html = dist('scheda');

    expect(html.match(/>Ira della Tempesta</g) ?? []).toHaveLength(1);
    expect(html.match(/>Tuono della Tempesta</g) ?? []).toHaveLength(1);
  });

  it('/personaggio/ li mostra in entrambe le tabelle e sull’armatura', () => {
    const html = dist('personaggio');

    // Tabella delle caratteristiche, da NOME_EN_CARATTERISTICA.
    expect(html).toContain('(Strength)');
    // Tabella delle abilità, dai dati del personaggio.
    expect(html).toContain('(Sleight of Hand)');
    // Armatura, in forma impilata.
    expect(html).toContain('Chain Mail');
  });

  it('la borsa porta i nomi inglesi nel blocco dei dati iniziali', () => {
    // La borsa è un'isola `client:only`: in HTML non c'è nulla da leggere, ma i
    // dati con cui si idraterà viaggiano nel JSON della pagina. Se `nomeEn` non
    // arrivasse fin lì, l'isola non avrebbe niente da mostrare.
    const html = dist('personaggio');

    expect(html).toContain('Weaver&#39;s Tools');
    expect(html).toContain('Backpack');
  });
});

describe('l’archivio', () => {
  // Una sede sola. Prima ce n'erano due — un `<dialog>` sulla Scheda e la
  // rotta `/preparati/` — e il commento del codice lo ammetteva: «questa rotta
  // ne è la seconda sede». Scegliere sei incantesimi fra trentanove è un
  // lavoro da pagina, e alla Scheda quell'elenco costava 35 KB e 471 nodi che
  // durante il gioco non guarda mai.
  it('è markup statico, non prodotto da un’isola', () => {
    // Trentanove testi di incantesimo dentro un bundle JavaScript sarebbero
    // peso iniziale su ogni pagina: l'isola governa le spunte, non l'elenco.
    const html = dist('preparati');

    expect(html).toContain('Individuazione del Magico');
    expect(html).toContain('rituale · Ritual');
  });

  it('offre una spunta per ogni incantesimo preparabile, e non di più', () => {
    const html = dist('preparati');
    const pool = JSON.parse(/id="dati-iniziali">(.*?)<\/script>/s.exec(html)![1]).pool as {
      slug: string;
    }[];

    expect(html.match(/data-preparabile/g) ?? []).toHaveLength(pool.length);
  });

  it('non offre spunte per trucchetti e dominio', () => {
    const html = dist('preparati');

    // Sono nell'elenco — si leggono — ma sempre disponibili: una spunta lì
    // sarebbe l'invito a un gesto che non serve.
    for (const slug of ['fiamma-sacra', 'frantumare', 'onda-tonante']) {
      expect(html).not.toContain(`data-preparabile="${slug}"`);
    }
  });

  it('non ha più una seconda sede dentro la Scheda', () => {
    const html = dist('scheda');

    expect(html).not.toContain('data-preparabile');
    expect(html).not.toMatch(/<dialog[^>]*id="archivio"/);
  });

  it('ogni sigillo puntato esiste davvero nel foglio dei simboli', () => {
    // Un `<use href="#sig-…">` verso un simbolo assente non disegna niente e
    // non protesta: resta un riquadro vuoto di 24px, e ci si accorge del buco
    // solo guardando la pagina giusta. È il modo in cui la carta verso
    // l'archivio poteva perdere l'icona appena presa, ma vale per tutti e
    // quaranta i sigilli.
    for (const rotta of ['scheda', 'preparati']) {
      const html = dist(rotta);
      const dichiarati = new Set(
        [...html.matchAll(/<symbol id="(sig-[a-z-]+)"/g)].map((m) => m[1]),
      );
      const puntati = new Set([...html.matchAll(/href="#(sig-[a-z-]+)"/g)].map((m) => m[1]));
      const vuoti = [...puntati].filter((id) => !dichiarati.has(id));

      expect({ rotta, vuoti }).toEqual({ rotta, vuoti: [] });
      expect(puntati.size).toBeGreaterThan(0);
    }
  });

  it('la carta verso l’archivio porta un numero, come le carte accanto', () => {
    // Le vicine hanno tutte un valore fra il nome e la freccia — il livello
    // dello slot. Questa non ne aveva nessuno, e diceva il proprio conto due
    // volte nella riga sotto per rimediare.
    const html = dist('scheda');

    expect(html).toContain('href="#sig-archivio"');
    expect(html).toMatch(/class="quanti">\d+</);
    expect(html).not.toContain('in archivio ·');
  });

  it('dalla Scheda ci si arriva con una carta, non con due collegamenti', () => {
    // Erano «Tutti gli incantesimi · apri come pagina»: due strade per lo
    // stesso posto, scritte come una nota a piè di sezione.
    const html = dist('scheda');

    expect(html).toContain('href="/preparati/"');
    expect(html).toContain('verso-archivio');
    expect(html).not.toContain('apri come pagina');
  });
});
