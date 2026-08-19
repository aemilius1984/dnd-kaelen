import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Come in `scheda.test.ts`: si legge il costruito, perché sotto vitest le
 *  content collection sono vuote e la pagina non arriva a produrre HTML. */
const dist = (rotta: string): string => {
  const percorso = `dist/${rotta}/index.html`;
  if (!existsSync(percorso)) {
    throw new Error(`${percorso} non esiste: lancia \`npm run build\` o \`npm run gate\`.`);
  }
  return readFileSync(percorso, 'utf8');
};

describe('la pagina del personaggio è l’archivio completo delle capacità', () => {
  it('nomina anche i tre usi di Incanalare Divinità', () => {
    // Quei tre stavano in `pg.capacita`, che è la lista che questa pagina
    // stampa per intero. Spostandoli dentro la risorsa che li alimenta la
    // pagina li avrebbe persi in silenzio: è il tipo di buco che nessuno nota
    // per due sessioni, perché la Scheda continua a mostrarli.
    // Senza gli script: `DatiIniziali` incorpora il personaggio intero come
    // JSON, quindi ogni frase dei dati compare nella pagina anche quando non
    // la rende nessuno. Cercare nel documento grezzo qui è inutile — passa
    // sempre.
    const html = dist('personaggio').replace(/<script[\s\S]*?<\/script>/g, ' ');

    // Non i nomi: quelli compaiono già di sfuggita nella descrizione della
    // risorsa («è il carburante comune di…»), e un test che li cercasse
    // passerebbe con la pagina vuota. Si cerca cosa fanno.
    for (const testo of [
      'Puoi guarirla di 1d8 + 3 PF',
      'I non morti scelti entro 30 ft effettuano un TS Saggezza',
      'usare il risultato massimo dei dadi',
    ]) {
      expect(html).toContain(testo);
    }
  });
});
