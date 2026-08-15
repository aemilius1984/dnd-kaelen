/** FNV-1a a 32 bit: deterministico, senza dipendenze, sufficiente per accorgersi
 *  che i dati della scheda sono cambiati fra una build e l'altra. */
export function hashDati(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
