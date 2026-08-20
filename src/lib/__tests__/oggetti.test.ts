import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale, type StatoSessione } from '@/lib/sheet-state';
import {
  PREFISSO_MIO,
  aggiungiOggetto,
  commutaIndossato,
  consuma,
  consumabili,
  impostaQuantitaAggiunta,
  prossimoIdOggetto,
  restituisci,
  rimuoviOggetto,
} from '@/lib/oggetti';

const pg = caricaPersonaggioDaFile();
let s: StatoSessione;

beforeEach(() => {
  s = statoIniziale(pg, 'v-test');
});

const pozione = {
  nome: 'Pozione di guarigione',
  quantita: 2,
  consumabile: true,
  nota: 'dal forziere · 2d4+2',
  modifiche: [],
};

describe('aggiungere', () => {
  it('l’oggetto entra con un id suo', () => {
    s = aggiungiOggetto(s, pozione);
    expect(s.oggettiAggiunti).toHaveLength(1);
    expect(s.oggettiAggiunti[0].id).toBe('mio:1');
    expect(s.oggettiAggiunti[0].nome).toBe('Pozione di guarigione');
  });

  it('gli id non collidono con quelli del repo, per costruzione', () => {
    // Il ':' non può comparire in uno slug, che viene dal nome di un file.
    s = aggiungiOggetto(s, pozione);
    for (const id of s.oggettiAggiunti.map((o) => o.id)) {
      expect(id.startsWith(PREFISSO_MIO)).toBe(true);
      expect(pg.equipaggiamento.some((e) => e.id === id)).toBe(false);
    }
  });

  it('il secondo oggetto non riusa l’id del primo, neanche dopo una rimozione', () => {
    // Riusare `mio:1` farebbe ricomparire indossato l'oggetto nuovo, perché
    // `indossati` porta gli id e non gli oggetti.
    s = aggiungiOggetto(s, pozione);
    s = aggiungiOggetto(s, { ...pozione, nome: 'Corda' });
    s = rimuoviOggetto(s, 'mio:1');
    s = aggiungiOggetto(s, { ...pozione, nome: 'Cintura' });
    expect(s.oggettiAggiunti.map((o) => o.id)).toEqual(['mio:2', 'mio:3']);
  });

  it('prossimoIdOggetto non consuma niente: dice solo quale sarà', () => {
    expect(prossimoIdOggetto(s)).toBe('mio:1');
    expect(prossimoIdOggetto(s)).toBe('mio:1');
  });
});

describe('quantità e rimozione', () => {
  beforeEach(() => {
    s = aggiungiOggetto(s, pozione);
  });

  it('la quantità si imposta e non scende sotto zero', () => {
    expect(impostaQuantitaAggiunta(s, 'mio:1', 5).oggettiAggiunti[0].quantita).toBe(5);
    expect(impostaQuantitaAggiunta(s, 'mio:1', -3).oggettiAggiunti[0].quantita).toBe(0);
  });

  it('rimuovere porta via anche l’indossato', () => {
    s = commutaIndossato(s, 'mio:1');
    expect(s.indossati).toEqual(['mio:1']);
    s = rimuoviOggetto(s, 'mio:1');
    expect(s.oggettiAggiunti).toEqual([]);
    expect(s.indossati).toEqual([]);
  });

  it('indossare è un interruttore', () => {
    expect(commutaIndossato(s, 'mio:1').indossati).toEqual(['mio:1']);
    expect(commutaIndossato(commutaIndossato(s, 'mio:1'), 'mio:1').indossati).toEqual([]);
  });
});

describe('i consumabili delle due sorgenti in un elenco solo', () => {
  it('prende quelli dei dati marcati consumabili, e nessun altro', () => {
    const elenco = consumabili(pg, s);
    expect(elenco.map((c) => c.id)).toEqual(['acqua-santa', 'razioni']);
    expect(elenco.every((c) => c.mio === false)).toBe(true);
  });

  it('la corda non è un consumabile e non sale in scheda', () => {
    expect(consumabili(pg, s).some((c) => c.id === 'corda')).toBe(false);
  });

  it('gli oggetti aggiunti marcati consumabili si accodano, marcati «miei»', () => {
    s = aggiungiOggetto(s, pozione);
    s = aggiungiOggetto(s, { nome: 'Cintura', quantita: 1, consumabile: false, modifiche: [] });
    const elenco = consumabili(pg, s);
    expect(elenco.map((c) => c.nome)).toEqual([
      'Fiala di acqua santa',
      'Razioni (giorni)',
      'Pozione di guarigione',
    ]);
    expect(elenco.at(-1)!.mio).toBe(true);
  });

  it('la quantità viene dallo stato, non dai dati', () => {
    s = { ...s, oggetti: { ...s.oggetti, razioni: 4 } };
    expect(consumabili(pg, s).find((c) => c.id === 'razioni')!.quantita).toBe(4);
  });
});

describe('consumare passa da una porta sola', () => {
  it('un consumabile del repo scende di uno', () => {
    s = consuma(s, 'acqua-santa');
    expect(s.oggetti['acqua-santa']).toBe(0);
  });

  it('un consumabile mio scende di uno', () => {
    s = aggiungiOggetto(s, pozione);
    s = consuma(s, 'mio:1');
    expect(s.oggettiAggiunti[0].quantita).toBe(1);
  });

  it('a zero non si scende sotto', () => {
    s = consuma(s, 'acqua-santa');
    expect(consuma(s, 'acqua-santa').oggetti['acqua-santa']).toBe(0);
  });

  it('restituire rimette esattamente quel che l’Annulla aveva tolto', () => {
    s = aggiungiOggetto(s, pozione);
    expect(restituisci(consuma(s, 'mio:1'), 'mio:1').oggettiAggiunti[0].quantita).toBe(2);
    expect(restituisci(consuma(s, 'razioni'), 'razioni').oggetti['razioni']).toBe(7);
  });
});
