import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import NomeDoppio from '@/components/ui/NomeDoppio.astro';

it('mette l inglese sotto l italiano', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(NomeDoppio, {
    props: { it: 'Maglio da guerra', en: 'Warhammer' },
  });

  expect(html).toContain('Maglio da guerra');
  expect(html).toContain('Warhammer');
});

it('sulla stessa riga quando lo spazio è stretto', async () => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(NomeDoppio, {
    props: { it: 'Atletica', en: 'Athletics', inline: true },
  });

  // Nelle tabelle di abilità e caratteristiche l'inglese sta fra parentesi:
  // raddoppiare l'altezza di 7 righe costa uno schermo di scorrimento per
  // un'informazione che lì serve di rado.
  expect(html).toContain('(Athletics)');
});
