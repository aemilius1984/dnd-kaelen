/** Serializza un valore per un `<script type="application/json">` scritto a
 *  tempo di build.
 *
 *  Dentro un elemento `script` il parser HTML non interpreta entità: legge
 *  testo grezzo finché non incontra `</script`, e lì chiude. Il blocco
 *  `#dati-iniziali` porta in pagina tutta la prosa di `kaelen.md`, quindi
 *  basterebbe quella sequenza in una nota dell'equipaggiamento per troncare il
 *  JSON e riversare il resto nel documento come markup — su tutte e quattro le
 *  pagine che incorporano DatiIniziali.
 *
 *  Fuori dalle stringhe il JSON non contiene mai un `<`, e dentro le stringhe
 *  `<` è la stessa cosa: sostituirli tutti è sempre lecito e il valore
 *  riletto con `JSON.parse` è identico all'originale. */
export function jsonPerScript(valore: unknown): string {
  return JSON.stringify(valore).replace(/</g, '\\u003c');
}
