import { describe, expect, it } from 'vitest';
import { onRequestGet, onRequestPost } from '../api/sessioni';
import { onRequestDelete, onRequestGet as onRequestUna } from '../api/sessioni/[id]';
import { D1Finto } from './d1-finto';

const statoFinto = (pf: number) => ({
  schemaVersion: 4,
  sheetVersion: 'v-test',
  pf,
  note: 'il molo di Thuunvar',
});

function contesto(db: D1Finto | null, richiesta: Request, params: Record<string, string> = {}) {
  return { env: db ? { DB: db } : {}, request: richiesta, params } as never;
}

const post = (corpo: unknown) =>
  new Request('https://kaelen.example/api/sessioni', {
    method: 'POST',
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });

describe('salvare una sessione', () => {
  it('inserisce una riga con lo stato intero', async () => {
    const db = new D1Finto();
    const r = await onRequestPost(
      contesto(db, post({ etichetta: 'il molo', stato: statoFinto(21) })),
    );

    expect(r.status).toBe(201);
    expect(db.righe).toHaveLength(1);
    expect(db.righe[0].sheet_v).toBe('v-test');
    expect(db.righe[0].schema_v).toBe(4);
    // La nota non si digita al salvataggio: è quella di `/note/`, e la riga ne
    // conserva una copia. Così il diario tiene quel che avevi scritto allora,
    // e non nasce un secondo posto dove scrivere la stessa frase.
    expect(db.righe[0].nota).toBe('il molo di Thuunvar');
    expect(JSON.parse(db.righe[0].stato).pf).toBe(21);
  });

  it('pota oltre la ventesima', async () => {
    // Un archivio che cresce per sempre è un archivio che nessuno rilegge.
    const db = new D1Finto();
    for (let i = 0; i < 23; i++) {
      await onRequestPost(contesto(db, post({ etichetta: `s${i}`, stato: statoFinto(i) })));
    }

    expect(db.righe).toHaveLength(20);
    // Le più vecchie, non le più recenti: si butta la sessione di tre
    // settimane fa, non quella di stasera.
    expect(db.righe.map((r) => r.etichetta)).not.toContain('s0');
    expect(db.righe.map((r) => r.etichetta)).toContain('s22');
  });

  it('un corpo malformato è 400, e non scrive niente', async () => {
    const db = new D1Finto();

    expect((await onRequestPost(contesto(db, post('non è json')))).status).toBe(400);
    expect((await onRequestPost(contesto(db, post({ etichetta: 'senza stato' })))).status).toBe(
      400,
    );
    expect(db.righe).toHaveLength(0);
  });
});

describe('rileggere l’elenco', () => {
  it('elenca dalla più recente, senza portarsi dietro gli stati interi', async () => {
    const db = new D1Finto();
    await onRequestPost(contesto(db, post({ etichetta: 'prima', stato: statoFinto(10) })));
    await new Promise((r) => setTimeout(r, 5));
    await onRequestPost(contesto(db, post({ etichetta: 'dopo', stato: statoFinto(20) })));

    const r = await onRequestGet(contesto(db, new Request('https://kaelen.example/api/sessioni')));
    const elenco = (await r.json()) as { etichetta: string }[];

    expect(r.status).toBe(200);
    expect(elenco.map((x) => x.etichetta)).toEqual(['dopo', 'prima']);
    // Venti stati interi per disegnare venti righe di riepilogo sarebbero
    // mezzo megabyte per una schermata che ne mostra cinque campi.
    expect(elenco[0]).not.toHaveProperty('stato');
  });

  it('una sola sessione arriva con lo stato, che è il motivo per cui la si chiede', async () => {
    const db = new D1Finto();
    await onRequestPost(contesto(db, post({ etichetta: 'prima', stato: statoFinto(13) })));

    const r = await onRequestUna(
      contesto(db, new Request('https://kaelen.example/api/sessioni/1'), { id: '1' }),
    );
    const riga = (await r.json()) as { stato: string };

    expect(r.status).toBe(200);
    expect(JSON.parse(riga.stato).pf).toBe(13);
  });

  it('una sessione che non c’è è 404, non un 200 vuoto', async () => {
    const db = new D1Finto();
    const r = await onRequestUna(
      contesto(db, new Request('https://kaelen.example/api/sessioni/9'), { id: '9' }),
    );

    expect(r.status).toBe(404);
  });
});

describe('eliminare', () => {
  it('toglie la riga chiesta e nessun’altra', async () => {
    const db = new D1Finto();
    await onRequestPost(contesto(db, post({ etichetta: 'a', stato: statoFinto(1) })));
    await onRequestPost(contesto(db, post({ etichetta: 'b', stato: statoFinto(2) })));

    const r = await onRequestDelete(
      contesto(db, new Request('https://kaelen.example/api/sessioni/1', { method: 'DELETE' }), {
        id: '1',
      }),
    );

    expect(r.status).toBe(204);
    expect(db.righe.map((x) => x.etichetta)).toEqual(['b']);
  });
});

describe('quando la nuvola non c’è', () => {
  it('senza binding risponde un errore pulito, non un’eccezione', async () => {
    // È il caso normale, non l'incidente: un clone senza Cloudflare, `npm run
    // dev`, il sito servito da qualunque altra parte. Il resto della scheda
    // deve continuare a funzionare come oggi.
    const r = await onRequestGet(
      contesto(null, new Request('https://kaelen.example/api/sessioni')),
    );

    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({ errore: expect.stringContaining('nuvola') });
  });

  it('con D1 muta risponde 502 e non finge di aver salvato', async () => {
    const db = new D1Finto();
    db.muto = true;
    const r = await onRequestPost(contesto(db, post({ etichetta: 'x', stato: statoFinto(5) })));

    expect(r.status).toBe(502);
  });
});
