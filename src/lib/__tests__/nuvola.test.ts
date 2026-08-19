import { describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { chiama, dueDate, esitoDi, quando, riepilogo, schedaPrecedente } from '@/lib/nuvola';
import { applicaDanno, spendiSlot, statoIniziale, usaRisorsa } from '@/lib/sheet-state';

const pg = caricaPersonaggioDaFile();

describe('il riepilogo di una sessione salvata', () => {
  it('dice a che punto era la serata, in una riga', () => {
    // Serve a scegliere fra venti salvataggi che si somigliano tutti: la data
    // dice quando, l'etichetta dove, questo a che punto.
    let s = statoIniziale(pg, 'v-test');
    s = applicaDanno(s, pg, 6);
    s = spendiSlot(s, pg, 1, 'comando');
    s = usaRisorsa(s, pg, 'incanalare', 'scintilla-divina');

    const riga = riepilogo(s, pg);

    expect(riga).toContain(`PF ${s.pf}/${pg.pfMax}`);
    expect(riga).toContain('5 slot');
    expect(riga).toContain('1 Incana.');
  });

  it('tace sulle risorse intatte', () => {
    // Tre risorse tutte piene farebbero una riga lunga il doppio per dire che
    // non è successo niente.
    const riga = riepilogo(statoIniziale(pg, 'v-test'), pg);

    expect(riga).toBe(`PF ${pg.pfMax}/${pg.pfMax} · 6 slot`);
  });
});

describe('la scheda cambiata sotto', () => {
  it('si riconosce dalla riga, senza scaricare lo stato', () => {
    // La regola di `sheetVersion` non ha eccezioni: al ripristino `carica()`
    // azzera. Questo serve a dirlo *prima* — scoprirlo dopo costa una serata.
    expect(schedaPrecedente({ sheet_v: 'v1' }, 'v2')).toBe(true);
    expect(schedaPrecedente({ sheet_v: 'v2' }, 'v2')).toBe(false);
  });
});

describe('le date come si leggono al tavolo', () => {
  const adesso = new Date('2026-08-19T21:40:00');

  it('oggi e ieri per nome, il resto col giorno', () => {
    expect(quando('2026-08-19T18:05:00', adesso)).toBe('oggi 18:05');
    expect(quando('2026-08-18T23:14:00', adesso)).toBe('ieri 23:14');
    expect(quando('2026-08-02T20:00:00', adesso)).toMatch(/2 ago 20:00/);
  });

  it('una data che non è una data non fa esplodere il pannello', () => {
    expect(quando('boh', adesso)).toBe('—');
  });

  it('le due affiancate, prima di sovrascrivere', () => {
    const detto = dueDate('2026-08-19T21:40:00', '2026-08-18T23:14:00');

    expect(detto).toContain('questo dispositivo:');
    expect(detto).toContain('il salvataggio:');
  });
});

describe('quando la nuvola non risponde', () => {
  it('riporta il messaggio dell’endpoint, non il codice', async () => {
    const r = new Response(JSON.stringify({ errore: 'La nuvola non è configurata.' }), {
      status: 503,
    });

    expect(await esitoDi(r)).toEqual({ ok: false, detto: 'La nuvola non è configurata.' });
  });

  it('una risposta che non è nostra si riconosce dal codice', async () => {
    // Un proxy, una pagina d'errore, il captive portal di un albergo.
    const r = new Response('<html>Accedi alla rete</html>', { status: 511 });

    expect(await esitoDi(r)).toEqual({ ok: false, detto: 'La nuvola ha risposto 511.' });
  });

  it('senza rete non lancia: dice che non è riuscito', async () => {
    // `fetch` rifiuta, e un rifiuto non gestito lascerebbe il pannello a
    // girare per sempre su «sto salvando».
    const originale = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error('offline'));

    const esito = await chiama('/api/sessioni');

    globalThis.fetch = originale;
    expect(esito.ok).toBe(false);
    expect(esito).toMatchObject({ detto: expect.stringContaining('senza rete') });
  });

  it('un 204 è un successo senza corpo, non un JSON malformato', async () => {
    expect(await esitoDi(new Response(null, { status: 204 }))).toEqual({
      ok: true,
      dato: undefined,
    });
  });
});
