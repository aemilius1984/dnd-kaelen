import { describe, expect, it } from 'vitest';
import { caricaIncantesimi } from '@/lib/carica-personaggio';
import { haSigilloProprio, simbolo } from '@/lib/sigilli';

const magie = caricaIncantesimi();

describe('sigilli degli incantesimi', () => {
  it('dà un sigillo proprio ai tre trucchetti', () => {
    expect(simbolo('guida', ['utilità'])).toBe('sig-guida');
    expect(simbolo('fiamma-sacra', ['danno'])).toBe('sig-fiamma-sacra');
    expect(simbolo('taumaturgia', ['utilità'])).toBe('sig-taumaturgia');
  });

  it('dà un sigillo proprio ai quattro incantesimi del dominio', () => {
    for (const slug of ['nube-di-nebbia', 'onda-tonante', 'folata-di-vento', 'frantumare']) {
      expect(haSigilloProprio(slug), slug).toBe(true);
    }
  });

  it('ripiega sull icona del primo tag per gli incantesimi senza sigillo', () => {
    expect(haSigilloProprio('silenzio')).toBe(false);
    expect(simbolo('silenzio', ['controllo'])).toBe('tag-controllo');
    expect(simbolo('ristorare-inferiore', ['cura'])).toBe('tag-cura');
  });

  it('assegna un simbolo a ogni incantesimo della collezione', () => {
    for (const [slug, m] of magie) {
      expect(simbolo(slug, m.tag), slug).toMatch(/^(sig|tag)-/);
    }
  });
});
