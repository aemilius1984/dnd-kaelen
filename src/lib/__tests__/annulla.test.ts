import { beforeEach, describe, expect, it } from 'vitest';
import { DURATA_ANNULLA, annullabile, dichiara, disfaUltima, scarta } from '@/lib/annulla';

describe('l’ultima azione annullabile', () => {
  beforeEach(() => {
    annullabile.value = null;
  });

  it('ne tiene una sola: la seconda scavalca la prima', () => {
    // È la regola che stava scritta a mano dentro `ControlliLancio`: si può
    // annullare l'ultima azione, non un intero storico. Qui si può provare
    // senza montare niente.
    dichiara({ detto: 'Comando', costo: 'Slot di 1° speso', disfa: () => {} });
    dichiara({ detto: 'Frantumare', costo: 'Slot di 2° speso', disfa: () => {} });

    expect(annullabile.value?.detto).toBe('Frantumare');
  });

  it('disfa quella, non l’altra', () => {
    const disfatte: string[] = [];
    dichiara({ detto: 'Comando', costo: '', disfa: () => disfatte.push('comando') });
    dichiara({ detto: 'Frantumare', costo: '', disfa: () => disfatte.push('frantumare') });
    disfaUltima();

    expect(disfatte).toEqual(['frantumare']);
    expect(annullabile.value).toBeNull();
  });

  it('disfare due volte disfa una volta sola', () => {
    // Il bottone e la scadenza del timer possono arrivare insieme: la seconda
    // chiamata non deve restituire uno slot che non era stato speso.
    let volte = 0;
    dichiara({ detto: 'Comando', costo: '', disfa: () => volte++ });
    disfaUltima();
    disfaUltima();

    expect(volte).toBe(1);
  });

  it('porta un seriale che cambia anche fra due azioni identiche', () => {
    // Serve da chiave alla striscia: due lanci uguali di fila danno un oggetto
    // uguale, e senza il seriale la barra continuerebbe la corsa del primo
    // invece di ripartire da piena.
    dichiara({ detto: 'Comando', costo: 'Slot di 1° speso', disfa: () => {} });
    const primo = annullabile.value!.seriale;
    dichiara({ detto: 'Comando', costo: 'Slot di 1° speso', disfa: () => {} });

    expect(annullabile.value!.seriale).not.toBe(primo);
  });

  it('scaduta la finestra si scarta, ma solo se nessuno l’ha già sostituita', () => {
    // Il timer del primo lancio può scadere dopo che il secondo ha preso il
    // posto: se scartasse alla cieca, il diritto di annullare il secondo
    // svanirebbe con la coda del primo.
    dichiara({ detto: 'Comando', costo: '', disfa: () => {} });
    const primo = annullabile.value!.seriale;
    dichiara({ detto: 'Frantumare', costo: '', disfa: () => {} });
    scarta(primo);

    expect(annullabile.value?.detto).toBe('Frantumare');

    scarta(annullabile.value!.seriale);
    expect(annullabile.value).toBeNull();
  });

  it('la durata è un numero solo', () => {
    // La barra che racconta il tempo lo riceve come proprietà personalizzata:
    // due numeri scritti a mano si scollerebbero al primo ripensamento, e la
    // barra finirebbe prima o dopo il diritto di annullare.
    expect(DURATA_ANNULLA).toBeGreaterThan(0);
  });
});
