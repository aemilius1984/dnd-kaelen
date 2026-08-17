import { expect, it } from 'vitest';
import { fondiCapacita } from '@/lib/capacita';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';

const pg = caricaPersonaggioDaFile();

it('fonde risorsa e reazione quando parlano della stessa cosa', () => {
  const fuse = fondiCapacita(pg);
  const ira = fuse.filter((c) => c.nome === 'Ira della Tempesta');

  // Compariva due volte, come contatore e come innesco: adesso una sola.
  expect(ira).toHaveLength(1);
  expect(ira[0].max).toBe(3);
  expect(ira[0].innesco).toBeTruthy();
});

it('tiene le capacità senza contatore e le risorse senza innesco', () => {
  const fuse = fondiCapacita(pg);
  const opportunita = fuse.find((c) => c.nome === 'Attacco di Opportunità');
  const incanalare = fuse.find((c) => c.id === 'incanalare');

  expect(opportunita?.max).toBeUndefined();
  expect(incanalare?.innesco).toBeUndefined();
  expect(incanalare?.max).toBe(2);
});

it('non perde né duplica nessuna voce', () => {
  const fuse = fondiCapacita(pg);
  const legate = pg.reazioni.filter((r) => r.risorsa !== undefined).length;

  expect(fuse).toHaveLength(pg.risorse.length + pg.reazioni.length - legate);
});

it('porta il nome inglese di ogni voce fusa', () => {
  // Se la fusione perdesse `nomeEn` la card mostrerebbe un nome inglese vuoto
  // senza che niente lo dica: il campo esiste nei dati e il test dello schema
  // lo pretende, ma nessuno garantisce che arrivi fin qui.
  for (const c of fondiCapacita(pg)) expect(c.nomeEn.trim()).not.toBe('');
});

it('non inventa un contatore per una reazione che non ne ha', () => {
  const fuse = fondiCapacita(pg);

  // `max` assente e `max: 0` sono due cose diverse: zero disegnerebbe una
  // fila di caselle vuote, che si legge come «esaurita» invece che «non si
  // conta».
  expect(fuse.find((c) => c.nome === 'Attacco di Opportunità')).toEqual({
    nome: 'Attacco di Opportunità',
    nomeEn: 'Opportunity Attack',
    innesco: expect.any(String),
    effetto: expect.any(String),
  });
});
