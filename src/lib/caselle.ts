/** Le caselle di un contatore, dalla prima piena all'ultima vuota. Sta in `lib`
 *  e non in un'isola perché due isole la usano — le file di slot e i contatori
 *  dentro le card — e una copia per isola è una copia che diverge. */
export function caselle(usate: number, max: number): boolean[] {
  return Array.from({ length: max }, (_, i) => i < max - usate);
}
