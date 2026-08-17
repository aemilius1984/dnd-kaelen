import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/** Toglie i commenti, poi elenca i selettori di primo livello. Basta per una
 *  guardia: i nostri fogli non annidano regole. */
function selettori(percorso: string): string[] {
  const css = readFileSync(percorso, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  return [...css.matchAll(/(^|\})([^{}]+)\{/g)].map((m) => m[2].trim()).filter(Boolean);
}

it('tokens.css dichiara token e nient altro', () => {
  const estranei = selettori('src/styles/tokens.css').filter((s) => !s.startsWith(':root'));

  // Il foglio dei token è il vocabolario: se ci entra una regola di componente,
  // la fase 2 non può più riscrivere i componenti senza rileggerlo tutto.
  expect(estranei).toEqual([]);
});
