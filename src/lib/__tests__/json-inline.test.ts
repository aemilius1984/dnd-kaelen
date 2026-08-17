// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { jsonPerScript } from '@/lib/json-inline';

// Il blocco `#dati-iniziali` porta dentro la pagina tutta la prosa di
// kaelen.md — note dell'equipaggiamento, interpretazione, capacità. Dentro un
// `<script>` il parser HTML non cerca entità: cerca `</script`, e chiude lì.
// Da quando DatiIniziali è condiviso, una sola sequenza del genere in un campo
// di testo spezzerebbe quattro pagine invece di una.

const velenoso = { pg: { nota: 'chiudi con </script><img src=x> e prosegui' } };

describe('JSON per un blocco script inline', () => {
  it('non lascia passare nessun minore, quindi nemmeno un terminatore', () => {
    expect(jsonPerScript(velenoso)).not.toContain('<');
    expect(jsonPerScript(velenoso)).toContain('\\u003c');
  });

  it('resta lo stesso valore una volta riletto', () => {
    expect(JSON.parse(jsonPerScript(velenoso))).toEqual(velenoso);
  });

  it('sopravvive al parser HTML dentro il blocco che DatiIniziali scrive', () => {
    document.body.innerHTML =
      `<script type="application/json" id="dati-iniziali">` +
      jsonPerScript(velenoso) +
      `</script><p id="dopo">resto della pagina</p>`;

    const nodo = document.getElementById('dati-iniziali');
    expect(JSON.parse(nodo!.textContent!)).toEqual(velenoso);
    // Il resto della pagina è ancora al suo posto, non risucchiato dentro lo
    // script né sputato fuori come markup.
    expect(document.getElementById('dopo')?.textContent).toBe('resto della pagina');
    expect(document.querySelector('img')).toBeNull();
  });

  it('è esattamente ciò che JSON.stringify da solo non sa fare', () => {
    // La prova che il fix serve: senza la fuga il blocco si chiude in mezzo al
    // valore e il documento si riempie di markup che non era markup.
    document.body.innerHTML =
      `<script type="application/json" id="dati-iniziali">` +
      JSON.stringify(velenoso) +
      `</script><p id="dopo">resto della pagina</p>`;

    const nodo = document.getElementById('dati-iniziali');
    expect(() => JSON.parse(nodo!.textContent!)).toThrow();
    expect(document.querySelector('img')).not.toBeNull();
  });
});
