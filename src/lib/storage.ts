import { signal } from '@preact/signals';
import type { Personaggio } from './schema';
import { carica, type StatoSessione } from './sheet-state';

export const CHIAVE = 'kaelen:v1';

export type VoceIncantesimo = {
  slug: string;
  nome: string;
  livello: number;
  dominio: boolean;
};

type DatiIniziali = { pg: Personaggio; sheetVersion: string; pool: VoceIncantesimo[] };

let dati: DatiIniziali | null = null;
let inizializzato = false;

export const stato = signal<StatoSessione>({} as StatoSessione);
export const avvisoAzzeramento = signal(false);

export function datiIniziali(): DatiIniziali {
  if (dati) return dati;
  const nodo = document.getElementById('dati-iniziali');
  if (!nodo?.textContent) throw new Error('Blocco #dati-iniziali mancante nella pagina');
  dati = JSON.parse(nodo.textContent) as DatiIniziali;
  return dati;
}

export function assicuraInizializzato(): void {
  if (inizializzato) return;
  const { pg, sheetVersion } = datiIniziali();
  const salvato = typeof localStorage === 'undefined' ? null : localStorage.getItem(CHIAVE);
  const { stato: iniziale, azzerato } = carica(salvato, pg, sheetVersion);
  stato.value = iniziale;
  avvisoAzzeramento.value = azzerato;
  inizializzato = true;
}

export function muta(fn: (s: StatoSessione) => StatoSessione): void {
  assicuraInizializzato();
  stato.value = fn(stato.value);
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(stato.value));
  } catch {
    // quota piena o storage negato: lo stato resta in memoria per la sessione
  }
}

/** Rimpiazza la sessione con una salvata altrove, passando dalla stessa
 *  `carica()` del primo caricamento.
 *
 *  Non `stato.value = quel che è arrivato`: la regola di `sheetVersion` non ha
 *  eccezioni, e una sessione scritta per una scheda diversa deve azzerare qui
 *  esattamente come azzererebbe all'apertura della pagina. Torna `true` se
 *  l'azzeramento c'è stato, così il pannello può dirlo invece di lasciarlo
 *  scoprire.
 *
 *  Prende il JSON grezzo e non un oggetto perché è la forma in cui la riga
 *  arriva dalla nuvola, ed è la stessa che `carica()` si aspetta. */
export function ripristina(json: string): boolean {
  const { pg, sheetVersion } = datiIniziali();
  const { stato: ripreso, azzerato } = carica(json, pg, sheetVersion);
  stato.value = ripreso;
  avvisoAzzeramento.value = azzerato;
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(ripreso));
  } catch {
    // quota piena o storage negato: lo stato resta in memoria per la sessione
  }
  return azzerato;
}

/** Azzera la sessione senza bisogno del blocco #dati-iniziali, così il
 *  comando può vivere nel menu di ogni pagina — anche quelle che non
 *  incorporano i dati del personaggio. Le preferenze (tema, splash) sono
 *  chiavi separate e restano. Il ricaricamento è iniettabile per i test. */
export function azzeraSessione(ricarica: () => void = () => location.reload()): void {
  try {
    localStorage.removeItem(CHIAVE);
  } catch {
    // storage negato: non c'era nulla da rimuovere
  }
  ricarica();
}
