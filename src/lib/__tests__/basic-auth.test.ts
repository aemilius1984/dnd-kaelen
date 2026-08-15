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

  it('rifiuta "Basic " senza nulla dopo', () => {
    expect(credenzialiValide('Basic ', 'ciurma', 'skystrike')).toBe(false);
  });

  it('rifiuta se lo username configurato è vuoto, anche con header corrispondente', () => {
    expect(credenzialiValide(header('', 'skystrike'), '', 'skystrike')).toBe(false);
  });

  it('rifiuta se la password configurata è vuota, anche con header corrispondente', () => {
    expect(credenzialiValide(header('ciurma', ''), 'ciurma', '')).toBe(false);
  });

  it('rifiuta credenziali configurate entrambe vuote, anche con header che decodifica in ":"', () => {
    // 'Basic Og==' decodifica in ":" — utente e password vuoti nell'header
    expect(credenzialiValide('Basic Og==', '', '')).toBe(false);
  });

  it('accetta lo schema "Basic" scritto in minuscolo', () => {
    const h = 'basic ' + btoa('ciurma:skystrike');
    expect(credenzialiValide(h, 'ciurma', 'skystrike')).toBe(true);
  });

  it('decodifica correttamente una password accentata (UTF-8, non Latin-1)', () => {
    const password = 'società';
    const bytesUtf8 = new TextEncoder().encode(`ciurma:${password}`);
    const binaria = String.fromCharCode(...bytesUtf8);
    const h = 'Basic ' + btoa(binaria);
    expect(credenzialiValide(h, 'ciurma', password)).toBe(true);
  });

  it('risponde 401 con la richiesta di autenticazione', () => {
    const r = rispostaNonAutorizzato();
    expect(r.status).toBe(401);
    expect(r.headers.get('WWW-Authenticate')).toContain('Basic');
  });

  it('il 401 non è cacheabile e porta gli header anti-indicizzazione', () => {
    const r = rispostaNonAutorizzato();
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(r.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(r.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
