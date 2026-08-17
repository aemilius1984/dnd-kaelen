import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import Superficie from '@/components/ui/Superficie.astro';
import TestaSezione from '@/components/ui/TestaSezione.astro';

it('la superficie porta il livello richiesto', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Superficie, {
    props: { livello: 'sollevata' },
    slots: { default: 'contenuto' },
  });

  expect(html).toContain('livello-sollevata');
  expect(html).toContain('contenuto');
});

it('la superficie è appoggiata quando non le si dice niente', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Superficie, { slots: { default: 'x' } });

  expect(html).toContain('livello-appoggiata');
});

it('la superficie può essere incassata', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Superficie, {
    props: { livello: 'incassata' },
    slots: { default: 'x' },
  });

  expect(html).toContain('livello-incassata');
});

it('la testa di sezione rende kicker e titolo, e il kicker è opzionale', async () => {
  const container = await AstroContainer.create();
  const con = await container.renderToString(TestaSezione, {
    props: { kicker: 'in combattimento' },
    slots: { default: 'Attacchi' },
  });
  const senza = await container.renderToString(TestaSezione, { slots: { default: 'Attacchi' } });

  expect(con).toContain('in combattimento');
  expect(con).toContain('Attacchi');
  expect(senza).toContain('Attacchi');
  expect(senza).not.toContain('kicker');
});
