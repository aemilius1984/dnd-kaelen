import { beforeEach, describe, expect, it } from 'vitest';
import { caricaIncantesimi, caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { annulla, apri, bozza, commuta, completa } from '@/lib/preparazione';

const pg = caricaPersonaggioDaFile();
const tutti = caricaIncantesimi();

beforeEach(() => annulla());

describe('la sessione di preparazione', () => {
  it('finché non è aperta, non esiste', () => {
    // È il cuore del P0: fuori dal Riposo Lungo i sei preparati non si
    // toccano. «Nessuna sessione» dev'essere uno stato distinguibile, non
    // una lista vuota che somiglia a una scelta in corso.
    expect(bozza.value).toBeNull();
  });

  it('si apre su una copia dei preparati correnti', () => {
    apri(pg.preparatiIniziali);

    expect(bozza.value).toEqual(pg.preparatiIniziali);
    // Copia, non riferimento: annullare non deve poter aver già toccato
    // l'originale.
    expect(bozza.value).not.toBe(pg.preparatiIniziali);
  });

  it('annullare non lascia una lista intermedia', () => {
    // «Annullare la finestra non deve lasciare una lista di cinque o sette».
    apri(pg.preparatiIniziali);
    bozza.value = commuta(bozza.value!, pg, pg.preparatiIniziali[0]);
    expect(bozza.value).toHaveLength(pg.limitePreparati - 1);

    annulla();

    expect(bozza.value).toBeNull();
  });
});

describe('cosa si può mettere nella bozza', () => {
  const sei = () => [...pg.preparatiIniziali];
  const poolFuoriDaiSei = () => {
    const slug = [...tutti.keys()].find(
      (x) =>
        !pg.preparatiIniziali.includes(x) &&
        !pg.dominio.includes(x) &&
        !pg.trucchetti.includes(x) &&
        (tutti.get(x)?.livello ?? 0) > 0,
    );
    if (!slug) throw new Error('nessun incantesimo preparabile oltre i sei');
    return slug;
  };

  it('togliere è sempre possibile', () => {
    expect(commuta(sei(), pg, pg.preparatiIniziali[0])).toHaveLength(pg.limitePreparati - 1);
  });

  it('aggiungere oltre il limite no', () => {
    const pieno = sei();
    const fuori = pg.preparatiIniziali[0];
    // Uno del pool che *non* è già fra i sei: preso dai dati, non scritto a
    // mano, o cambiare la scheda romperebbe la prova per il motivo sbagliato.
    const altro = poolFuoriDaiSei();

    expect(commuta(pieno, pg, altro)).toBe(pieno);
    // Ma liberato un posto, entra.
    expect(commuta(commuta(pieno, pg, fuori), pg, altro)).toHaveLength(pg.limitePreparati);
  });

  it('gli incantesimi di dominio e i trucchetti non entrano mai', () => {
    // Sono sempre preparati e fuori dal limite di sei: metterli in lista
    // ruberebbe un posto a un incantesimo che invece va scelto.
    const quasi = sei().slice(1);

    expect(commuta(quasi, pg, pg.dominio[0])).toBe(quasi);
    expect(commuta(quasi, pg, pg.trucchetti[0])).toBe(quasi);
  });

  it('si conferma solo con esattamente sei', () => {
    expect(completa(sei(), pg)).toBe(true);
    expect(completa(sei().slice(1), pg)).toBe(false);
  });
});
