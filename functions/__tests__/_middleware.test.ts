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
