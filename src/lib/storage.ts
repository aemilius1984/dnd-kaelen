import { signal } from '@preact/signals';
import type { Personaggio } from './schema';
import { carica, statoIniziale, type StatoSessione } from './sheet-state';

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

export function azzeraTutto(): void {
  const { pg, sheetVersion } = datiIniziali();
  stato.value = statoIniziale(pg, sheetVersion);
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(stato.value));
  } catch {
    // quota piena o storage negato: lo stato in memoria resta comunque azzerato
  }
}
