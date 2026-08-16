import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { capitoloSchema, incantesimoSchema, personaggioSchema } from './lib/schema';

const character = defineCollection({
  loader: glob({ base: './src/content/character', pattern: '**/*.md' }),
  schema: personaggioSchema.extend({
    trucchetti: z.array(reference('spells')),
    preparatiIniziali: z.array(reference('spells')),
    dominio: z.array(reference('spells')),
  }),
});

const spells = defineCollection({
  loader: glob({ base: './src/content/spells', pattern: '**/*.md' }),
  schema: incantesimoSchema,
});

const background = defineCollection({
  loader: glob({ base: './src/content/background', pattern: '**/*.md' }),
  schema: capitoloSchema,
});

export const collections = { character, spells, background };
