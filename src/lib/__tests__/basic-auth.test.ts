import { describe, expect, it } from 'vitest';
import { credenzialiValide, rispostaNonAutorizzato } from '@/lib/basic-auth';

const header = (utente: string, password: string) => 'Basic ' + btoa(`${utente}:${password}`);

describe('basic auth', () => {
  it('accetta le credenziali corrette', () => {
    expect(credenzialiValide(header('ciurma', 'skystrike'), 'ciurma', 'skystrike')).toBe(true);
  });

  it('rifiuta password e utente sbagliati', () => {
    expect(credenzialiValide(header('ciurma', 'altro'), 'ciurma', 'skystrike')).toBe(false);
    expect(credenzialiValide(header('altro', 'skystrike'), 'ciurma', 'skystrike')).toBe(false);
  });

  it('rifiuta header assenti o malformati', () => {
    expect(credenzialiValide(null, 'ciurma', 'skystrike')).toBe(false);
    expect(credenzialiValide('Bearer abc', 'ciurma', 'skystrike')).toBe(false);
    expect(credenzialiValide('Basic non-base64!!', 'ciurma', 'skystrike')).toBe(false);
  });

  it('accetta password con i due punti', () => {
    expect(credenzialiValide(header('ciurma', 'a:b:c'), 'ciurma', 'a:b:c')).toBe(true);
  });

  it('risponde 401 con la richiesta di autenticazione', () => {
    const r = rispostaNonAutorizzato();
    expect(r.status).toBe(401);
    expect(r.headers.get('WWW-Authenticate')).toContain('Basic');
  });
});
