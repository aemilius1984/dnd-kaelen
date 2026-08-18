import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Il lampo vive nel `<style>` di `index.astro`, non in un foglio condiviso:
 *  queste asserzioni leggono il sorgente della pagina. Sul costruito Astro
 *  rinomina i keyframes con un suffisso di scope, e le regole andrebbero
 *  inseguite dentro nomi generati — qui interessa il patto scritto a mano. */
const PAGINA = readFileSync('src/pages/index.astro', 'utf8');

/** La dichiarazione `animation:` della regola `selettore`. */
function animazione(selettore: string): string {
  const apertura = PAGINA.indexOf(`${selettore} {`);
  if (apertura === -1) throw new Error(`regola non trovata: ${selettore}`);
  const chiusura = PAGINA.indexOf('}', apertura);
  const corpo = PAGINA.slice(apertura, chiusura);
  const riga = /animation:\s*([^;]+);/.exec(corpo);
  if (!riga) throw new Error(`nessuna animation in: ${selettore}`);
  return riga[1].replace(/\s+/g, ' ').trim();
}

describe('il lampo è ambiente, non introduzione', () => {
  it('gira in loop invece di spegnersi dopo due colpi', () => {
    // Con un conteggio finito il temporale finisce mentre la pagina è ancora
    // aperta: da lì in poi la splash è una fotografia ferma.
    expect(animazione('.lampo')).toContain('infinite');
  });

  it('il primo colpo arriva insieme alle porte, non prima', () => {
    // «Quasi immediato dopo il caricamento»: il ritardo del lampo non deve
    // precedere la comparsa dei bottoni, o lampeggia su uno schermo vuoto.
    const ritardoPorte = /animation:[^;]*?entra[^;]*?(\d+(?:\.\d+)?)s\s+forwards/.exec(PAGINA);
    if (!ritardoPorte) throw new Error('ritardo di .porte non trovato');
    const ritardoLampo = /(\d+(?:\.\d+)?)s\s+infinite/.exec(animazione('.lampo'));
    if (!ritardoLampo) throw new Error('ritardo di .lampo non trovato');

    expect(Number(ritardoLampo[1])).toBeGreaterThanOrEqual(Number(ritardoPorte[1]));
    expect(Number(ritardoLampo[1])).toBeLessThanOrEqual(3);
  });

  it('le pause tra una scarica e l’altra sono diverse fra loro', () => {
    // Una scarica sola per ciclo dà un metronomo. Servono più colpi a
    // distanze irregolari dentro lo stesso giro di keyframes.
    const corpo = /@keyframes lampo \{([\s\S]*?)\n {2}\}/.exec(PAGINA);
    if (!corpo) throw new Error('@keyframes lampo non trovato');
    const tappe = [...corpo[1].matchAll(/(\d+(?:\.\d+)?)% \{\s*opacity: (\d+(?:\.\d+)?)/g)].map(
      (m) => ({ quando: Number(m[1]), quanto: Number(m[2]) }),
    );

    // Una scarica è una corsa di tappe accese: ne conta l'inizio, non i colpi
    // interni, così il doppio colpo di una folgore non passa per due lampi.
    const inizi: number[] = [];
    let acceso = false;
    for (const tappa of tappe) {
      if (tappa.quanto > 0 && !acceso) inizi.push(tappa.quando);
      acceso = tappa.quanto > 0;
    }

    expect(inizi.length).toBeGreaterThanOrEqual(3);
    const pause = inizi.slice(1).map((inizio, i) => inizio - inizi[i]);
    expect(new Set(pause.map((pausa) => pausa.toFixed(2))).size).toBe(pause.length);
  });

  it('non è chiuso in nessun @media se non quello di reduced-motion', () => {
    // La richiesta è esplicita: anche su desktop. La regola deve stare al
    // primo livello del foglio, non dentro la coda per schermi larghi.
    expect(PAGINA).toMatch(/^ {2}\.lampo \{/m);
    const desktop = /@media \(min-width: 901px\) \{([\s\S]*?)\n {2}\}/.exec(PAGINA);
    if (!desktop) throw new Error('blocco desktop non trovato');
    expect(desktop[1]).not.toContain('.lampo');
  });

  it('né il tocco né la seconda visita del giorno lo spengono', () => {
    // La regola di salto esiste per l’introduzione — deriva e porte. Il
    // lampo non è un’introduzione: se finisce lì dentro, chi rinaviga
    // sulla home nello stesso giorno non lo vede mai più.
    const salto = /\.splash\.finita[\s\S]*?\{\s*animation: none;/.exec(PAGINA);
    if (!salto) throw new Error('regola di salto non trovata');
    expect(salto[0]).not.toContain('.lampo');
  });
});
