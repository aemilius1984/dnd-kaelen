import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '../_middleware';

type Contesto = Parameters<typeof onRequest>[0];

function contesto(opts: { auth?: string; env?: { SITE_USER?: string; SITE_PASS?: string } }): {
  ctx: Contesto;
  next: ReturnType<typeof vi.fn>;
} {
  const headers = new Headers();
  if (opts.auth !== undefined) headers.set('Authorization', opts.auth);
  const next = vi.fn(async () => new Response('ok'));
  const ctx = {
    request: new Request('https://kaelen.example/', { headers }),
    env: opts.env ?? {},
    next,
  } as unknown as Contesto;
  return { ctx, next };
}

describe('_middleware', () => {
  it('senza SITE_USER/SITE_PASS risponde 401 "non configurata" e non chiama next', async () => {
    const { ctx, next } = contesto({ env: {} });
    const r = await onRequest(ctx);
    expect(r.status).toBe(401);
    expect(await r.text()).toContain('non configurata');
    expect(next).not.toHaveBeenCalled();
  });

  it('con segreti fatti di soli spazi risponde 401 "non configurata"', async () => {
    const { ctx, next } = contesto({ env: { SITE_USER: '   ', SITE_PASS: 'skystrike' } });
    const r = await onRequest(ctx);
    expect(r.status).toBe(401);
    expect(await r.text()).toContain('non configurata');
    expect(next).not.toHaveBeenCalled();
  });

  it('con credenziali sbagliate risponde 401 con WWW-Authenticate e non chiama next', async () => {
    const { ctx, next } = contesto({
      auth: 'Basic ' + btoa('ciurma:sbagliata'),
      env: { SITE_USER: 'ciurma', SITE_PASS: 'skystrike' },
    });
    const r = await onRequest(ctx);
    expect(r.status).toBe(401);
    expect(r.headers.get('WWW-Authenticate')).toContain('Basic');
    expect(next).not.toHaveBeenCalled();
  });

  it('con credenziali corrette chiama next esattamente una volta', async () => {
    const { ctx, next } = contesto({
      auth: 'Basic ' + btoa('ciurma:skystrike'),
      env: { SITE_USER: 'ciurma', SITE_PASS: 'skystrike' },
    });
    const r = await onRequest(ctx);
    expect(next).toHaveBeenCalledTimes(1);
    expect(await r.text()).toBe('ok');
  });
});

describe('la copertura di /api/', () => {
  // Gli endpoint delle sessioni non hanno un'autenticazione propria: contano
  // su questo middleware. È un'assunzione di sicurezza, e le assunzioni di
  // sicurezza si provano — se un giorno il middleware si restringesse a una
  // rotta, l'archivio delle sessioni resterebbe aperto senza che niente lo
  // dica.
  it('vale anche sulle rotte di /api/, e senza segreti risponde 401', async () => {
    const { ctx, next } = contesto({ env: {} });
    const richiesta = new Request('https://kaelen.example/api/sessioni', { method: 'POST' });
    const conApi = { ...ctx, request: richiesta } as typeof ctx;

    const r = await onRequest(conApi);

    expect(r.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('non lascia passare /api/ con credenziali sbagliate', async () => {
    const { ctx, next } = contesto({
      auth: 'Basic ' + btoa('tizio:sbagliata'),
      env: { SITE_USER: 'kaelen', SITE_PASS: 'giusta' },
    });
    const conApi = {
      ...ctx,
      request: new Request('https://kaelen.example/api/sessioni/1', { method: 'DELETE' }),
    } as typeof ctx;

    expect((await onRequest(conApi)).status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
