import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

/** Ogni sorgente sotto una cartella, ricorsivamente. Stesso aiutante di
 *  `token.test.ts`: due righe copiate costano meno di un modulo condiviso fra
 *  test che non condividono altro. */
function file(cartella: string, estensioni: string[]): string[] {
  return readdirSync(cartella).flatMap((nome) => {
    const p = join(cartella, nome);
    if (statSync(p).isDirectory()) return file(p, estensioni);
    return estensioni.some((e) => nome.endsWith(e)) ? [p] : [];
  });
}

/** Toglie i commenti, poi elenca i selettori di primo livello. Basta per una
 *  guardia: i nostri fogli non annidano regole. */
function selettori(percorso: string): string[] {
  const css = readFileSync(percorso, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/(^|\})([^{}]+)\{/g)].map((m) => m[2].trim()).filter(Boolean);
}

it('tokens.css dichiara token e nient altro', () => {
  // Un selettore composto come `:root, .componente { … }` supererebbe un
  // controllo su tutta la stringa: bisogna che *ogni* parte separata da
  // virgola inizi per `:root`, non che lo faccia la prima.
  const estranei = selettori('src/styles/tokens.css').filter(
    (s) => !s.split(',').every((parte) => parte.trim().startsWith(':root')),
  );

  // Il foglio dei token è il vocabolario: se ci entra una regola di componente,
  // la fase 2 non può più riscrivere i componenti senza rileggerlo tutto.
  expect(estranei).toEqual([]);
});

/** Le classi che in `componenti.css` si piazzano da sole — `position: fixed` o
 *  `absolute` su un selettore di una classe sola. Un nome così non è più
 *  un'etichetta: è un posto sullo schermo. */
function classiCheSiPiazzano(): string[] {
  const css = readFileSync('src/styles/componenti.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const trovate: string[] = [];
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const selettore = m[1].trim();
    if (!/position:\s*(fixed|absolute)/.test(m[2])) continue;
    if (/^\.[a-z0-9-]+$/.test(selettore)) trovate.push(selettore.slice(1));
  }
  return trovate;
}

it('un nome che vale come posizione non è di due componenti', () => {
  // `.annulla` era due cose: la striscia che chiede se disfare l'ultimo lancio,
  // e il bottone «Annulla» della sessione di preparazione. La prima era
  // `position: fixed`, e la regola si prendeva addosso anche il secondo: il
  // bottone se ne stava in mezzo all'elenco degli incantesimi mentre il suo
  // piede era 104px più in basso. Misurato, non dedotto.
  //
  // Il DOM lo teneva al posto giusto e la classe lo portava altrove, quindi
  // nessun test di struttura poteva accorgersene: la prova sta qui, sui nomi.
  const sorgenti = file('src', ['.astro', '.tsx']);
  const guasti: string[] = [];

  for (const classe of classiCheSiPiazzano()) {
    const dove = sorgenti.filter((p) => {
      const testo = readFileSync(p, 'utf8');
      return new RegExp(`class(:list)?=[{"'\\[][^>]*\\b${classe}\\b`).test(testo);
    });
    if (dove.length > 1) guasti.push(`${classe}: ${dove.join(', ')}`);
  }

  expect(guasti).toEqual([]);
});
