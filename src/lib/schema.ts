import { z } from 'zod';

export const caratteristicaEnum = z.enum(['for', 'des', 'cos', 'int', 'sag', 'car']);
export type Caratteristica = z.infer<typeof caratteristicaEnum>;

export const personaggioSchema = z.object({
  nome: z.string(),
  specie: z.string(),
  taglia: z.string(),
  classe: z.string(),
  livello: z.number().int().positive(),
  sottoclasse: z.string(),
  allineamento: z.string(),
  divinita: z.string(),
  background: z.string(),
  caratteristiche: z.object({
    for: z.number().int(),
    des: z.number().int(),
    cos: z.number().int(),
    int: z.number().int(),
    sag: z.number().int(),
    car: z.number().int(),
  }),
  competenza: z.number().int(),
  caratteristicaIncantesimi: caratteristicaEnum,
  tsCompetenti: z.array(caratteristicaEnum),
  abilita: z.array(
    z.object({
      nome: z.string(),
      nomeEn: z.string(),
      caratteristica: caratteristicaEnum,
      origine: z.string(),
    }),
  ),
  pfMax: z.number().int().positive(),
  dadoVita: z.string(),
  numeroDadiVita: z.number().int().positive(),
  velocita: z.number().int(),
  armatura: z.object({
    nome: z.string(),
    nomeEn: z.string(),
    ca: z.number().int(),
    tipo: z.enum(['leggera', 'media', 'pesante']),
    scudo: z.number().int(),
    note: z.string().optional(),
  }),
  attacchi: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      nomeEn: z.string(),
      caratteristica: caratteristicaEnum,
      competente: z.boolean(),
      gittata: z.string(),
      proprieta: z.array(z.string()).default([]),
      danno: z.object({ dado: z.string().nullable(), fisso: z.number().int() }),
      tipoDanno: z.string(),
      descrizione: z.string(),
      note: z.string().optional(),
    }),
  ),
  risorse: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      nomeEn: z.string(),
      max: z.number().int().positive(),
      recupero: z.enum(['breve', 'lungo']),
      descrizione: z.string(),
    }),
  ),
  slot: z.array(z.object({ livello: z.number().int(), max: z.number().int() })),
  trucchetti: z.array(z.string()),
  preparatiIniziali: z.array(z.string()),
  dominio: z.array(z.string()),
  limitePreparati: z.number().int().positive(),
  monete: z.object({ mo: z.number().int(), ma: z.number().int(), mr: z.number().int() }),
  equipaggiamento: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      nomeEn: z.string(),
      quantita: z.number().int(),
      consumabile: z.boolean(),
      note: z.string().optional(),
    }),
  ),
  lingue: z.array(z.string()),
  strumenti: z.array(
    z.object({
      nome: z.string(),
      nomeEn: z.string(),
      caratteristica: caratteristicaEnum,
      competente: z.boolean(),
    }),
  ),
  capacita: z.array(z.object({ titolo: z.string(), paragrafi: z.array(z.string()) })),
  reazioni: z.array(
    z.object({
      nome: z.string(),
      nomeEn: z.string(),
      innesco: z.string(),
      effetto: z.string(),
      // Solo le reazioni che consumano un contatore lo portano: l'Attacco di
      // Opportunità non ne ha uno, e un campo obbligatorio lo costringerebbe
      // a dichiarare una risorsa che non esiste.
      risorsa: z.string().optional(),
    }),
  ),
  interpretazione: z.object({
    tratto: z.string(),
    ideale: z.string(),
    legame: z.string(),
    difetto: z.string(),
    paura: z.string(),
  }),
});

export type Personaggio = z.infer<typeof personaggioSchema>;

export const incantesimoSchema = z.object({
  nome: z.string(),
  nomeEn: z.string(),
  livello: z.number().int().min(0).max(2),
  lancio: z.enum(['azione', 'azione bonus', 'reazione', '1 minuto', '10 minuti']),
  gittata: z.string(),
  componenti: z.string(),
  concentrazione: z.boolean(),
  durata: z.string(),
  tiro: z.string().nullable(),
  danno: z.string().nullable(),
  slotSuperiore: z.string().nullable(),
  tag: z.array(z.enum(['cura', 'danno', 'controllo', 'utilità'])),
  dominio: z.boolean().default(false),
});

export type Incantesimo = z.infer<typeof incantesimoSchema>;

export const capitoloSchema = z.object({
  titolo: z.string(),
  ordine: z.number().int(),
});
