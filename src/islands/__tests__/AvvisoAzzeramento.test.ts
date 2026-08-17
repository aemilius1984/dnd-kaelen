// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, render } from 'preact';
import AvvisoAzzeramento from '@/islands/AvvisoAzzeramento';
import { avvisoAzzeramento } from '@/lib/storage';

// L'avviso viveva dentro PfTracker, quindi solo su /scheda/. Se un cambio di
// sheetVersion atterra mentre si è su /note/ — o /preparati/, o /personaggio/
// — la sessione è già stata azzerata e la prima `muta()` di quella pagina
// persiste lo stato fresco: l'avviso è perso per sempre. Qui l'isola è
// condivisa e la sua unica regola è che legga il segnale senza pretendere il
// blocco `#dati-iniziali`, che su una pagina qualsiasi potrebbe non esserci
// ancora stato letto.

let radice: HTMLDivElement;

/** Preact accoda i rendering da segnale: si aspetta il giro successivo. */
const giro = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  document.body.innerHTML = '';
  radice = document.createElement('div');
  document.body.append(radice);
  avvisoAzzeramento.value = false;
});

afterEach(() => {
  render(null, radice);
  avvisoAzzeramento.value = false;
});

describe('avviso di azzeramento condiviso', () => {
  it('non disegna niente quando non c è stato alcun azzeramento', () => {
    render(h(AvvisoAzzeramento, {}), radice);
    expect(radice.textContent).toBe('');
  });

  it('mostra l avviso senza il blocco dei dati iniziali nella pagina', () => {
    // È la pagina che non è /scheda/: nessun `#dati-iniziali` letto da questa
    // isola, che non deve chiamare `assicuraInizializzato()`.
    expect(document.getElementById('dati-iniziali')).toBeNull();
    avvisoAzzeramento.value = true;

    expect(() => render(h(AvvisoAzzeramento, {}), radice)).not.toThrow();
    expect(radice.textContent).toContain('Scheda aggiornata');
    expect(radice.querySelector('.avviso')?.getAttribute('role')).toBe('status');
  });

  it('compare quando il segnale si alza a isola già montata', async () => {
    render(h(AvvisoAzzeramento, {}), radice);
    expect(radice.textContent).toBe('');

    // È quello che succede al vero: l'isola della pagina (Note, Borsa,
    // PreparatiPicker) idrata dopo e chiama `assicuraInizializzato()`.
    avvisoAzzeramento.value = true;
    await giro();

    expect(radice.textContent).toContain('Scheda aggiornata');
  });

  it('si congeda con «Ho capito»', async () => {
    avvisoAzzeramento.value = true;
    render(h(AvvisoAzzeramento, {}), radice);

    radice.querySelector('button')!.click();
    await giro();

    expect(avvisoAzzeramento.value).toBe(false);
    expect(radice.textContent).toBe('');
  });
});
