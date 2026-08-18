import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION } from '@/lib/sheet-state';

/** Il markup si guarda sul costruito, per la stessa ragione di
 *  `scheda.test.ts`: sotto vitest le content collection sono vuote e la
 *  container API non arriva a rendere una pagina intera. Il CSS si guarda nel
 *  sorgente, dove i nomi delle classi non sono ancora stati sfregiati dallo
 *  scope di Astro. */
const MENU = readFileSync('src/components/Menu.astro', 'utf8');

const dist = (rotta: string): string => {
  const percorso = rotta === '' ? 'dist/index.html' : `dist/${rotta}/index.html`;
  if (!existsSync(percorso)) {
    throw new Error(
      `${percorso} non esiste: questi test leggono il costruito, lancia npm run build.`,
    );
  }
  return readFileSync(percorso, 'utf8');
};

describe('la barra e le sue scorciatoie', () => {
  it('ogni pagina col menu porta le tre scorciatoie, home compresa', () => {
    // Dal menu non si tornava a `/`: era una domanda aperta del ridisegno,
    // e questa barra la chiude.
    for (const rotta of ['scheda', 'personaggio', 'storia', 'preparati', 'note']) {
      const html = dist(rotta);
      expect(html).toContain('class="barra"');
      for (const href of ['href="/"', 'href="/scheda/"', 'href="/storia/"']) {
        expect(html).toContain(href);
      }
    }
  });

  it('la splash resta nuda', () => {
    // `/` è l'ingresso: immagine a tutto schermo, lampo, due porte. Una barra
    // lì sopra coprirebbe la fotografia senza avere niente da nascondere,
    // visto che la splash non scorre.
    expect(dist('')).not.toContain('class="barra"');
  });

  it('la voce corrente si marca sia in barra sia nella tendina', () => {
    const html = dist('scheda');
    expect([...html.matchAll(/aria-current="page"/g)]).toHaveLength(2);
  });

  it('la tendina elenca tutte e cinque le rotte', () => {
    const html = dist('note');
    for (const testo of ['Scheda', 'Personaggio', 'Storia', 'Preparati', 'Note']) {
      expect(html).toContain(`>${testo}</span>`);
    }
  });

  it('i numeri delle voci non stanno nel markup', () => {
    // Sono un contatore CSS: rinumerare vuol dire riordinare l'elenco e basta.
    // Se finissero nel markup, una voce spostata lascerebbe due «03».
    expect(MENU).toContain('counter-increment: voce');
    expect(MENU).toMatch(/content:\s*'0' counter\(voce\)/);
    expect(MENU).not.toMatch(/>\s*0[1-5]\s*</);
  });

  it('il colofone porta la versione dello schema, non un numero copiato', () => {
    expect(MENU).toContain('SCHEMA_VERSION');
    // Agganciato alla costante, non al numero: quando lo schema avanza — ed
    // è avanzato a 3 col nuovo stato a 0 PF — questa prova segue da sé
    // invece di diventare rossa per un motivo che non c'entra.
    expect(dist('scheda')).toContain(`schema v${SCHEMA_VERSION}`);
  });
});

describe('la disposizione della barra', () => {
  it('la casa è un’icona, e ha comunque un nome da leggere', () => {
    // Un collegamento il cui unico contenuto è un disegno non ha nome
    // accessibile: al lettore di schermo arriverebbe «link» e basta.
    const html = dist('scheda');
    expect(html).toContain('aria-label="Home"');
    expect(html).not.toMatch(/>Home<\/a>/);
  });

  it('tre colonne: casa a sinistra, le due parole al centro, ☰ a destra', () => {
    // Con `space-between` le parole si appoggerebbero ai lati e il centro
    // dipenderebbe dalla larghezza dell'icona: le colonne lo fissano.
    const barra = MENU.slice(MENU.indexOf('.barra {'), MENU.indexOf('@supports'));
    expect(barra).toMatch(/grid-template-columns:\s*1fr auto 1fr/);
    expect(MENU).toMatch(/\.scorciatoie \{[^}]*justify-self:\s*center/);
  });
});

describe('lo spazio verticale delle voci', () => {
  it('le voci respirano sulla scala del sito, non su numeri inventati', () => {
    // Il respiro serve al pollice: una riga di 47px si sbaglia a colpirla.
    // I valori vengono dai token di spazio, come ovunque nel sito.
    const voce = MENU.slice(MENU.indexOf('.tendina li a {'), MENU.indexOf('.tendina li a::before'));
    const padding = /padding:\s*([^;]+);/.exec(voce);
    if (!padding) throw new Error('padding della voce non trovato');
    expect(padding[1]).toMatch(/^var\(--spazio-\d\)( var\(--spazio-\d\))?$/);
  });

  it('e il respiro non fa sbucare la parola dalla sua finestra', () => {
    // La parola sale da sotto dentro una finestra che la ritaglia. Se il
    // ritaglio stesse sul collegamento, crescerne il padding scoprirebbe la
    // parola da ferma: la finestra deve fasciare la riga di testo e nient'altro.
    expect(MENU).toMatch(/\.finestra \{[^}]*overflow:\s*hidden/);
    const voce = MENU.slice(MENU.indexOf('.tendina li a {'), MENU.indexOf('.tendina li a::before'));
    expect(voce).not.toContain('overflow: hidden');
  });
});

describe('si toglie di mezzo scendendo e torna salendo', () => {
  it('lo stato nascosto è un attributo che porta la barra fuori schermo', () => {
    expect(MENU).toMatch(/\.barra\[data-nascosta\]\s*\{\s*transform:\s*translateY\(-100%\)/);
  });

  it('vale a ogni larghezza, non solo su mobile', () => {
    // La regola deve stare al primo livello del foglio: chiusa in una coda
    // per schermi stretti, su desktop la barra non si toglierebbe mai.
    expect(MENU).toMatch(/^ {2}\.barra\[data-nascosta\]/m);
  });

  it('a tendina aperta la barra non può andarsene', () => {
    // La tendina pende dalla barra: portarla via la lascerebbe attaccata al
    // nulla, con la × fuori schermo.
    expect(MENU).toMatch(/\.barra:has\(\.menu\[open\]\)\s*\{[^}]*translateY\(0\)/);
  });
});

describe('il vetro', () => {
  it('porta il prefisso -webkit-, che su iOS non è opzionale', () => {
    const barra = MENU.slice(MENU.indexOf('.barra {'), MENU.indexOf('@supports'));
    expect(barra).toContain('-webkit-backdrop-filter: blur(');
    expect(barra).toContain('backdrop-filter: blur(');
  });

  it('dove il blur non c’è, il fondo diventa quasi pieno', () => {
    // Mezzo velo su un testo che ci scorre sotto non è trasparenza: è testo
    // illeggibile sopra altro testo.
    const supporta = MENU.slice(MENU.indexOf('@supports'));
    expect(supporta.slice(0, 300)).toMatch(/var\(--carta\) 9[0-9]%/);
  });
});

describe('la tendina', () => {
  it('resta dentro <details>, non diventa una checkbox travestita', () => {
    // È <details> a portare stato, tastiera e annuncio «compresso/espanso»
    // senza JavaScript. Una checkbox con una label si annuncia «casella di
    // spunta», che di un menu non dice niente.
    expect(MENU).toContain('<details class="menu">');
    expect(MENU).toContain('<summary>');
    expect(MENU).not.toContain('type="checkbox"');
  });

  it('da chiuso toglie le voci dal giro dei Tab', () => {
    // Righe a 0fr nascondono alla vista e non al focus: senza `visibility` si
    // tabula dentro una tendina chiusa, e il fuoco sparisce dallo schermo.
    const tendina = MENU.slice(MENU.indexOf('.tendina {'), MENU.indexOf('.rullo {'));
    expect(tendina).toContain('visibility: hidden');
    expect(tendina).toContain('grid-template-rows: 0fr');
  });

  it('le voci entrano sfalsate, non tutte insieme', () => {
    expect(MENU).toMatch(/transition-delay:\s*calc\(var\(--r\) \* \d+ms\)/);
  });
});
