// Le immagini grandi non pesano sull'installazione: chi gioca dal telefono
// non deve scaricare lo splash da desktop per andare offline. Sopra la
// soglia si mettono in cache alla prima visualizzazione, per via della
// strategia stale-while-revalidate già attiva nel fetch handler.
// 200 KiB: sotto lo splash mobile (~161 KiB) e il ritratto di /personaggio/
// (~164 KiB), sopra lo splash desktop (~213 KiB) — verificato sui file
// prodotti da `astro build`, non sui sorgenti non ottimizzati.
export const SOGLIA_PRECACHE = 200 * 1024;

/**
 * Divide l'elenco dei file di `dist` nei due insiemi che il service worker
 * usa, che non sono lo stesso insieme:
 *
 * - `precache`: gli url da scaricare all'installazione. I file oltre soglia
 *   restano fuori, per non far pagare a un telefono l'intero peso del sito.
 * - `impronta`: tutto, soglia compresa. Il contenuto di ogni file entra
 *   nell'hash che diventa il nome della cache, quindi *anche* quello dei file
 *   che non si precacheano: se un file oltre soglia non contasse, sostituire
 *   il solo `kaelen-splash-desktop.webp` lascerebbe l'impronta identica, il
 *   service worker non svuoterebbe la cache vecchia e chi ha la PWA
 *   installata continuerebbe a ricevere la versione stantia dalla
 *   stale-while-revalidate.
 *
 * L'ordinamento è per url in entrambi, così due build sullo stesso contenuto
 * producono la stessa impronta indipendentemente dall'ordine di lettura del
 * file system.
 *
 * @param {{url: string, percorso: string, dimensione: number}[]} voci
 * @param {number} [soglia]
 * @returns {{precache: string[], impronta: {url: string, percorso: string}[]}}
 */
export function pianoPrecache(voci, soglia = SOGLIA_PRECACHE) {
  const ordinate = [...voci].sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  return {
    precache: ordinate.filter((v) => v.dimensione <= soglia).map((v) => v.url),
    impronta: ordinate.map(({ url, percorso }) => ({ url, percorso })),
  };
}
