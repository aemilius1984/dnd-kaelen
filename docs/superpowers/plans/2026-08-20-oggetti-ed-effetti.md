# Oggetti al tavolo ed effetti temporanei — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dare a Kaelen due cose che oggi non ha — oggetti raccolti al tavolo ed effetti temporanei che cambiano davvero i numeri della scheda — con un motore solo dietro tutt'e due.

**Architecture:** un modulo puro (`adesso.ts`) prende il personaggio e lo stato di sessione e restituisce Kaelen com'è in questo momento, con i punteggi già riscritti; `derive.ts` non cambia di una riga e riceve semplicemente un personaggio diverso. Le due isole nuove non generano contenuto che il build avrebbe potuto stampare: scrivono dentro innesti statici con `createPortal`, la tecnica che `Contatori.tsx` usa già con `[data-caselle]`.

**Tech Stack:** Astro 7 statico, isole Preact `client:only` con `@preact/signals`, zod per gli schemi, vitest + jsdom per i test, i test di pagina leggono `dist/` costruito.

**Spec:** `web/docs/superpowers/specs/2026-08-20-oggetti-ed-effetti-design.md`

## Global Constraints

Valgono per **ogni** task, senza ripeterle task per task.

- Si lavora in `web/`. Ogni percorso in questo piano è relativo a `web/`.
- Prosa, commenti e messaggi d'errore **in italiano**. Oggetto del commit in inglese, corpo in italiano.
- Ogni commit finisce con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Ogni task finisce con `npm run gate` verde **e** un commit. `gate` è `check && build && test`, in quest'ordine: i test di pagina leggono `dist/`.
- `npm run gate` resta **offline**: niente rete, niente `wrangler`.
- **HTML statico.** Un'isola non contiene mai contenuto che il build avrebbe potuto stampare. Il JavaScript è l'eccezione, non la regola.
- I valori derivati stanno in `src/lib/`, mai dentro il markup.
- Ogni bersaglio da toccare è **≥ 44px**, compresi il `×` sui chip e i passi di quantità.
- Ogni `env()` porta il proprio ripiego: `env(safe-area-inset-bottom, 0px)`.
- Verifica visiva a **390×844**.
- Le regole CSS dei `<dialog>` non dichiarano `display` fuori da `[open]`: c'è una guardia in `src/styles/__tests__/altezze.test.ts` che lo verifica.
- Nessun `SELECT`/`INSERT` nuovo su D1: `0001_sessioni.sql` mette l'intero `StatoSessione` in una colonna JSON, e i campi nuovi viaggiano da soli. **Nessuna seconda migrazione remota.**
- Il ramo: aprire `feat/oggetti-ed-effetti` da `fix/segnalazioni-mobile` prima del Task 1 (`git switch -c feat/oggetti-ed-effetti`). La spec è già committata in `d405d62` sul ramo di partenza.

## Struttura dei file

**Moduli nuovi in `src/lib/`**

| file           | responsabilità                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `modifiche.ts` | il vocabolario chiuso: `Modifica`, `VoceFinale`, lo schema zod, le due regole di composizione. Nessuna dipendenza tranne zod. |
| `adesso.ts`    | il motore: `kaelenAdesso(pg, s)`. Legge lo stato, non lo scrive.                                                              |
| `effetti.ts`   | il tipo `Effetto` e i suoi mutatori, concentrazione compresa.                                                                 |
| `oggetti.ts`   | il tipo `OggettoAggiunto`, i suoi mutatori, e la vista unificata dei consumabili.                                             |

**Moduli toccati in `src/lib/`**

- `sheet-state.ts` — quattro campi nuovi, `SCHEMA_VERSION` a 5, `migraDa4`, la sopravvivenza all'azzeramento, `aggiorna` esportato.
- `riposi.ts` — le righe nuove di `conseguenzaRiposo`.
- `schema.ts` — `effetto` sugli incantesimi, `gruppo` sull'equipaggiamento.

**Isole e componenti**

- `src/islands/StrisciaEffetti.tsx` — i chip, il `+`, i portali sui numeri delle difese.
- `src/islands/parti/ModuloOggetto.tsx` — il modulo «aggiungi oggetto», usato da due sedi. `parti/` raccoglie i componenti Preact che **non** sono isole: non li monta Astro, li importa un'isola.
- `src/islands/Consumabili.tsx` — le cariche e i comandi dei consumabili su `/scheda/`.
- `src/components/Consumabili.astro` — le carte dei consumabili che vengono dai dati, con i loro innesti vuoti.
- `src/islands/Borsa.tsx` — riscritta a tre gruppi.
- `src/pages/scheda.astro`, `src/pages/personaggio.astro` — gli innesti e le sezioni nuove.

**Perché il grafo delle dipendenze non ha cicli.** `modifiche.ts` non importa niente del progetto. `effetti.ts` e `oggetti.ts` importano `modifiche.ts` (tipi) e `sheet-state.ts` (il solo valore `aggiorna`); `sheet-state.ts` importa da loro **solo tipi**, che si cancellano in compilazione. `adesso.ts` sta a valle di tutti e non è importato da nessuno di loro.

## Il dizionario dei nomi

Chi implementa un task vede solo il proprio. Questi nomi valgono in tutto il piano e non si riscrivono:

- `Modifica`, `VoceFinale`, `modificaSchema`, `componiPunteggi`, `componiVoci` — Task 1
- `Effetto`, `OggettoAggiunto` — Task 2
- `accendiEffetto`, `spegniEffetto`, `spegniTuttiGliEffetti`, `spentoDa`, `impostaEsaurimento`, `nuovoIdEffetto` — Task 3
- `prossimoIdOggetto`, `aggiungiOggetto`, `impostaQuantitaAggiunta`, `rimuoviOggetto`, `commutaIndossato`, `consumabili`, `consuma`, `restituisci`, `VoceConsumabile` — Task 4
- `kaelenAdesso`, `Adesso`, `modificheEsaurimento`, `riassuntoVoci` — Task 5

---

### Task 1: il vocabolario delle modifiche

Il modulo più a monte di tutti: due generi di modifica e due regole per comporli. Nessun altro file lo precede, quindi è il primo.

**Files:**

- Create: `src/lib/modifiche.ts`
- Test: `src/lib/__tests__/modifiche.test.ts`

**Interfaces:**

- Consumes: niente (solo `zod`).
- Produces:
  - `export const vociFinali: readonly ['ca','ts','colpire','prove','velocita']`
  - `export type VoceFinale = (typeof vociFinali)[number]`
  - `export const caratteristicheModificabili: readonly ['for','des','cos','int','sag','car']`
  - `export const modificaSchema: z.ZodType` — union discriminata su `genere`
  - `export type Modifica` — `{ genere: 'punteggio'; bersaglio: 'for'|…|'car'; valore: number } | { genere: 'voce'; bersaglio: VoceFinale; valore: number }`
  - `export function componiPunteggi(m: Modifica[]): Partial<Record<'for'|'des'|'cos'|'int'|'sag'|'car', number>>`
  - `export function componiVoci(m: Modifica[]): Record<VoceFinale, number>`

**Nota sulla forma.** La spec disegnava `Modifica` come un'interfaccia piatta con `bersaglio: Caratteristica | VoceFinale`. Qui è una **union discriminata**: `{ genere: 'voce', bersaglio: 'for' }` è uno stato illegale, e in forma piatta il compilatore lo accetterebbe. È l'unico scostamento dalla spec, ed è una stretta, non un allargamento.

- [ ] **Step 1: scrivere il test che fallisce**

Crea `src/lib/__tests__/modifiche.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { caratteristicaEnum } from '@/lib/schema';
import {
  caratteristicheModificabili,
  componiPunteggi,
  componiVoci,
  modificaSchema,
  vociFinali,
  type Modifica,
} from '@/lib/modifiche';

describe('i punteggi non si sommano: vince il più alto', () => {
  it('due oggetti che impostano la stessa caratteristica non fanno 41', () => {
    const m: Modifica[] = [
      { genere: 'punteggio', bersaglio: 'for', valore: 21 },
      { genere: 'punteggio', bersaglio: 'for', valore: 20 },
    ];
    expect(componiPunteggi(m)).toEqual({ for: 21 });
  });

  it('caratteristiche diverse convivono', () => {
    const m: Modifica[] = [
      { genere: 'punteggio', bersaglio: 'for', valore: 19 },
      { genere: 'punteggio', bersaglio: 'des', valore: 18 },
    ];
    expect(componiPunteggi(m)).toEqual({ for: 19, des: 18 });
  });

  it('le voci finali non entrano nei punteggi', () => {
    expect(componiPunteggi([{ genere: 'voce', bersaglio: 'ca', valore: 2 }])).toEqual({});
  });
});

describe('le voci finali si sommano davvero', () => {
  it('Scudo della Fede e uno scudo magico fanno tre punti di CA', () => {
    const m: Modifica[] = [
      { genere: 'voce', bersaglio: 'ca', valore: 2 },
      { genere: 'voce', bersaglio: 'ca', valore: 1 },
    ];
    expect(componiVoci(m).ca).toBe(3);
  });

  it('le voci non toccate valgono zero, non undefined', () => {
    expect(componiVoci([])).toEqual({ ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 });
  });

  it('gli addendi negativi sottraggono', () => {
    expect(componiVoci([{ genere: 'voce', bersaglio: 'prove', valore: -4 }]).prove).toBe(-4);
  });
});

describe('lo schema', () => {
  it('rifiuta una caratteristica messa fra le voci finali', () => {
    expect(modificaSchema.safeParse({ genere: 'voce', bersaglio: 'for', valore: 1 }).success).toBe(
      false,
    );
  });

  it('rifiuta una voce finale messa fra i punteggi', () => {
    expect(
      modificaSchema.safeParse({ genere: 'punteggio', bersaglio: 'ca', valore: 1 }).success,
    ).toBe(false);
  });

  it('accetta le due forme legittime', () => {
    expect(modificaSchema.parse({ genere: 'punteggio', bersaglio: 'for', valore: 21 })).toEqual({
      genere: 'punteggio',
      bersaglio: 'for',
      valore: 21,
    });
    expect(modificaSchema.parse({ genere: 'voce', bersaglio: 'ca', valore: 2 })).toEqual({
      genere: 'voce',
      bersaglio: 'ca',
      valore: 2,
    });
  });
});

it('le sei caratteristiche sono le stesse dello schema del personaggio', () => {
  // Due elenchi copiati a mano divergono al primo aumento di punteggio. Questo
  // modulo non può importare `caratteristicaEnum` — creerebbe un ciclo con
  // `schema.ts`, che importa `modificaSchema` — quindi la guardia sta qui.
  expect([...caratteristicheModificabili]).toEqual([...caratteristicaEnum.options]);
});

it('le voci finali sono cinque e non di più', () => {
  // Aggiungerne una è una decisione: vuol dire che esiste un numero in pagina
  // che qualcuno deve poter modificare, e che qualcuno deve andarci a scrivere.
  expect([...vociFinali]).toEqual(['ca', 'ts', 'colpire', 'prove', 'velocita']);
});
```

- [ ] **Step 2: lanciarlo e vederlo fallire**

Run: `npx vitest run src/lib/__tests__/modifiche.test.ts`
Expected: FAIL, «Failed to resolve import "@/lib/modifiche"».

- [ ] **Step 3: scrivere il modulo**

Crea `src/lib/modifiche.ts`:

```ts
import { z } from 'zod';

/** Il vocabolario chiuso delle modifiche a Kaelen. Sta in un modulo suo, senza
 *  dipendenze, perché lo leggono in quattro — lo schema degli incantesimi, gli
 *  effetti, gli oggetti indossati, il motore — e ognuno importandolo dagli
 *  altri chiuderebbe un ciclo.
 *
 *  Due generi, e sono davvero due cose diverse. Un `punteggio` è **assoluto**:
 *  il manuale scrive che con una Cintura di Forza del Gigante il punteggio
 *  *diventa* ventuno, non che sale di cinque. Una `voce` è un **addendo** su un
 *  numero già stampato sulla scheda. Da questa differenza vengono le due regole
 *  di composizione qui sotto, che non sono una scelta di gusto: i punteggi che
 *  si sommassero darebbero quarantuno di Forza. */

/** I numeri già stampati sulla scheda su cui una modifica è un addendo.
 *  Cinque, e allungare l'elenco è una decisione: significa che esiste un altro
 *  numero in pagina che qualcuno deve andare a riscrivere. */
export const vociFinali = ['ca', 'ts', 'colpire', 'prove', 'velocita'] as const;
export type VoceFinale = (typeof vociFinali)[number];

/** Le sei di sempre. Ricopiate e non importate da `schema.ts`: importarle
 *  chiuderebbe un ciclo, perché è `schema.ts` a importare `modificaSchema`.
 *  Che restino le stesse lo garantisce un test in `modifiche.test.ts`. */
export const caratteristicheModificabili = ['for', 'des', 'cos', 'int', 'sag', 'car'] as const;

/** Union discriminata e non un oggetto piatto con `bersaglio` largo: una voce
 *  finale col genere `punteggio` è uno stato illegale, e in forma piatta il
 *  compilatore lo lascerebbe passare fino al primo numero sbagliato in pagina. */
export const modificaSchema = z.discriminatedUnion('genere', [
  z.object({
    genere: z.literal('punteggio'),
    bersaglio: z.enum(caratteristicheModificabili),
    valore: z.number().int(),
  }),
  z.object({
    genere: z.literal('voce'),
    bersaglio: z.enum(vociFinali),
    valore: z.number().int(),
  }),
]);

export type Modifica = z.infer<typeof modificaSchema>;

type Punteggi = Partial<Record<(typeof caratteristicheModificabili)[number], number>>;

/** Il più alto vince. È la regola generale del regolamento sugli effetti che
 *  non si cumulano, e qui vale fra le modifiche: il confronto con il punteggio
 *  *di base* lo fa `kaelenAdesso`, che è l'unico posto che il personaggio ce
 *  l'ha davanti. */
export function componiPunteggi(modifiche: Modifica[]): Punteggi {
  const out: Punteggi = {};
  for (const m of modifiche) {
    if (m.genere !== 'punteggio') continue;
    const attuale = out[m.bersaglio];
    out[m.bersaglio] = attuale === undefined ? m.valore : Math.max(attuale, m.valore);
  }
  return out;
}

/** Queste invece si sommano davvero: Scudo della Fede e uno scudo magico danno
 *  insieme tre punti di CA, ed è corretto. Zero e non `undefined` sulle voci
 *  intonse, così chi legge somma senza guardie. */
export function componiVoci(modifiche: Modifica[]): Record<VoceFinale, number> {
  const out = { ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 };
  for (const m of modifiche) {
    if (m.genere === 'voce') out[m.bersaglio] += m.valore;
  }
  return out;
}
```

- [ ] **Step 4: lanciare i test e vederli passare**

Run: `npx vitest run src/lib/__tests__/modifiche.test.ts`
Expected: PASS, 9 test.

- [ ] **Step 5: il cancello e il commit**

```bash
npm run gate
git add src/lib/modifiche.ts src/lib/__tests__/modifiche.test.ts
git commit -m "feat: add the closed vocabulary of modifications

Due generi che si compongono in due modi diversi: i punteggi sono
assoluti e vince il più alto, le voci finali sono addendi e si sommano.
Union discriminata perché una voce finale col genere «punteggio» è uno
stato illegale, e in forma piatta passerebbe il compilatore.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: lo stato di sessione allo schema 5

Quattro campi nuovi, la migrazione dalla 4, e la sopravvivenza all'azzeramento per quel che il repo non sa ricostruire.

**Files:**

- Create: `src/lib/effetti.ts` (solo il tipo `Effetto`; i mutatori arrivano nel Task 3)
- Create: `src/lib/oggetti.ts` (solo il tipo `OggettoAggiunto`; i mutatori nel Task 4)
- Modify: `src/lib/sheet-state.ts`
- Test: `src/lib/__tests__/sheet-state.test.ts` (aggiunte in coda)

**Interfaces:**

- Consumes: `Modifica` da `@/lib/modifiche` (Task 1).
- Produces:
  - `export interface Effetto { id: string; nome: string; origine?: string; durata: string; concentrazione: boolean; promemoria?: string; modifiche: Modifica[]; accesoIl: string }`
  - `export interface OggettoAggiunto { id: string; nome: string; quantita: number; consumabile: boolean; nota?: string; modifiche: Modifica[] }`
  - `StatoSessione` guadagna `oggettiAggiunti: OggettoAggiunto[]`, `effetti: Effetto[]`, `indossati: string[]`, `esaurimento: number`
  - `SCHEMA_VERSION = 5`
  - `export function statoIniziale(pg: Personaggio, sheetVersion: string, precedente?: StatoSessione): StatoSessione`
  - `export function aggiorna(s: StatoSessione, patch: Partial<StatoSessione>): StatoSessione` — smette di essere privata

- [ ] **Step 1: scrivere i test che falliscono**

Aggiungi in coda a `src/lib/__tests__/sheet-state.test.ts` (e aggiungi `SCHEMA_VERSION` all'import se non c'è già — c'è):

```ts
describe('schema 5: i campi nuovi', () => {
  it('parte vuoto di effetti, oggetti aggiunti e indossati', () => {
    expect(s.effetti).toEqual([]);
    expect(s.oggettiAggiunti).toEqual([]);
    expect(s.indossati).toEqual([]);
    expect(s.esaurimento).toBe(0);
  });

  it('la migrazione dalla 4 aggiunge i quattro campi vuoti senza toccare il resto', () => {
    const v4 = {
      ...s,
      schemaVersion: 4,
      pf: 9,
      note: 'il forziere era una trappola',
    } as unknown as Record<string, unknown>;
    delete v4.effetti;
    delete v4.oggettiAggiunti;
    delete v4.indossati;
    delete v4.esaurimento;

    const { stato, azzerato } = carica(JSON.stringify(v4), pg, VERSIONE);

    expect(azzerato).toBe(false);
    expect(stato.schemaVersion).toBe(SCHEMA_VERSION);
    expect(stato.pf).toBe(9);
    expect(stato.note).toBe('il forziere era una trappola');
    expect(stato.effetti).toEqual([]);
    expect(stato.oggettiAggiunti).toEqual([]);
    expect(stato.indossati).toEqual([]);
    expect(stato.esaurimento).toBe(0);
  });

  it('la catena arriva fino alla 5 anche partendo dalla 2', () => {
    const v2 = { ...s, schemaVersion: 2, pf: 0, tsMorte: { successi: 3, fallimenti: 0 } };
    const { stato, azzerato } = carica(JSON.stringify(v2), pg, VERSIONE);
    expect(azzerato).toBe(false);
    expect(stato.schemaVersion).toBe(SCHEMA_VERSION);
    expect(stato.statoVitale).toBe('stabile');
    expect(stato.esaurimento).toBe(0);
  });
});

describe('cosa sopravvive all’azzeramento', () => {
  const mieiOggetti = [
    { id: 'mio:1', nome: 'Pozione di guarigione', quantita: 2, consumabile: true, modifiche: [] },
  ];

  it('gli oggetti aggiunti a mano e le note restano quando i dati cambiano', () => {
    const salvato = {
      ...s,
      pf: 3,
      note: 'Marrok mente',
      oggettiAggiunti: mieiOggetti,
      indossati: ['mio:1'],
    };

    const { stato, azzerato } = carica(JSON.stringify(salvato), pg, 'versione-diversa');

    // Azzerata sì: i numeri che il repo sa ricostruire tornano al massimo.
    expect(azzerato).toBe(true);
    expect(stato.pf).toBe(pg.pfMax);
    // Ma di questi due l'autore è il giocatore, e nessuna build li riscrive.
    expect(stato.oggettiAggiunti).toEqual(mieiOggetti);
    expect(stato.note).toBe('Marrok mente');
    expect(stato.indossati).toEqual(['mio:1']);
  });

  it('gli effetti attivi invece si spengono: durano minuti, non build', () => {
    const salvato = {
      ...s,
      effetti: [
        {
          id: 'eff:1',
          nome: 'Benedizione',
          durata: '1 minuto',
          concentrazione: true,
          modifiche: [],
          accesoIl: '2026-08-20T10:00:00.000Z',
        },
      ],
      esaurimento: 2,
    };

    const { stato } = carica(JSON.stringify(salvato), pg, 'versione-diversa');

    expect(stato.effetti).toEqual([]);
    expect(stato.esaurimento).toBe(0);
  });

  it('un salvataggio illeggibile non porta dentro niente', () => {
    // Non c'è nulla da salvare da un JSON rotto, e inventarselo sarebbe peggio.
    const { stato, azzerato } = carica('{ questo non è', pg, VERSIONE);
    expect(azzerato).toBe(true);
    expect(stato.oggettiAggiunti).toEqual([]);
    expect(stato.note).toBe('');
  });

  it('un salvataggio vecchio senza il campo non fa esplodere niente', () => {
    const vecchio = { ...s, schemaVersion: 4 } as unknown as Record<string, unknown>;
    delete vecchio.oggettiAggiunti;
    const { stato } = carica(JSON.stringify(vecchio), pg, 'versione-diversa');
    expect(stato.oggettiAggiunti).toEqual([]);
  });

  it('un indossato che non ha più il suo oggetto non resta appeso', () => {
    const salvato = { ...s, oggettiAggiunti: [], indossati: ['mio:9'] };
    const { stato } = carica(JSON.stringify(salvato), pg, 'versione-diversa');
    expect(stato.indossati).toEqual([]);
  });
});
```

- [ ] **Step 2: lanciarli e vederli fallire**

Run: `npx vitest run src/lib/__tests__/sheet-state.test.ts`
Expected: FAIL — `s.effetti` è `undefined`, e `carica` con `sheetVersion` diversa restituisce note vuote.

- [ ] **Step 3: i due tipi**

Crea `src/lib/effetti.ts`:

```ts
import type { Modifica } from './modifiche';

/** Uno stato temporaneo addosso a Kaelen. Nasce da un lancio, da un incantesimo
 *  di qualcun altro, o da un'ampolla stappata dal nemico.
 *
 *  `modifiche` può essere **vuoto**: Benedizione dà un dado da tirare, e un
 *  dado non è un addendo — sta nella striscia col suo promemoria e non tocca
 *  nessun numero. Scudo della Fede è il contrario: nessun promemoria, una
 *  modifica sola, e la CA in pagina legge venti. */
export interface Effetto {
  id: string;
  nome: string;
  /** Lo slug dell'incantesimo, quando l'effetto nasce da un lancio. Serve a non
   *  accendere due Benedizioni: rilanciare rinnova, non accumula. */
  origine?: string;
  /** Un'etichetta, non un conto alla rovescia: «1 minuto». Un contatore di round
   *  richiede che qualcuno prema un bottone a ogni round di ogni combattimento,
   *  e la prima volta che ci si dimentica mente con l'aria di dire il vero.
   *  Un'etichetta non promette nulla, quindi non può mentire. */
  durata: string;
  concentrazione: boolean;
  /** Quel che non diventa un numero: «+1d4 ai tiri per colpire e ai TS». */
  promemoria?: string;
  modifiche: Modifica[];
  accesoIl: string;
}
```

Crea `src/lib/oggetti.ts`:

```ts
import type { Modifica } from './modifiche';

/** Un oggetto trovato al tavolo. Non può vivere nei dati del repo: un forziere
 *  non si apre con una pull request, e `campiVersione` include
 *  `equipaggiamento` — toccare la quantità di una voce lì dentro azzera la
 *  sessione salvata. */
export interface OggettoAggiunto {
  /** `mio:<n>`. Il carattere `:` non può comparire in uno slug, che viene dal
   *  nome di un file: la collisione con gli id del repo è impossibile per
   *  costruzione, non per fortuna. Stessa ragione di `SPESA_MANUALE`. */
  id: string;
  nome: string;
  quantita: number;
  consumabile: boolean;
  nota?: string;
  /** Vuoto se non è magico, che è il caso normale. */
  modifiche: Modifica[];
}
```

- [ ] **Step 4: i campi, la migrazione e la sopravvivenza**

In `src/lib/sheet-state.ts`:

1. In cima, dopo `import type { Personaggio } from './schema';`:

```ts
import type { Effetto } from './effetti';
import type { OggettoAggiunto } from './oggetti';
```

2. `export const SCHEMA_VERSION = 4;` diventa `= 5;`

3. Dentro `interface StatoSessione`, subito prima di `aggiornatoIl`:

```ts
  /** Gli oggetti raccolti al tavolo. L'unica cosa nello stato di cui l'autore è
   *  il giocatore, e per questo l'unica che sopravvive all'azzeramento. */
  oggettiAggiunti: OggettoAggiunto[];
  /** Quel che è acceso adesso. Si azzera a ogni riposo e a ogni cambio di dati:
   *  gli effetti durano minuti, e fra due build ne passano di più. */
  effetti: Effetto[];
  /** Gli id degli oggetti aggiunti che Kaelen porta addosso. Un elenco a parte e
   *  non una bandiera sull'oggetto: la stessa fiala può stare nello zaino di
   *  un compagno senza smettere di essere sua. */
  indossati: string[];
  /** 0..6. Nella 2024 ogni livello è −2 a ogni prova col d20 e −5 piedi di
   *  velocità, e il sesto livello è la morte. Non è un effetto e non sta in
   *  quella lista: il riposo lungo ne toglie uno, il breve non lo tocca. */
  esaurimento: number;
```

4. `aggiorna` smette di essere privata — la useranno `effetti.ts` e `oggetti.ts`:

```ts
/** L'unico modo di scrivere nello stato: ogni mutazione passa di qui, e da qui
 *  esce con l'orologio aggiornato. Esportata perché i mutatori degli effetti e
 *  degli oggetti stanno in moduli loro — questo file è già lungo — e
 *  reimplementarla lì sarebbe un secondo orologio da tenere allineato. */
export function aggiorna(s: StatoSessione, patch: Partial<StatoSessione>): StatoSessione {
```

5. `statoIniziale` prende un terzo argomento:

```ts
/** Lo stato di partenza. `precedente` è il salvataggio che si sta buttando via:
 *  quasi tutto quel che contiene il repo sa ricostruirlo, e ricostruirlo è
 *  giusto. Gli oggetti raccolti al tavolo e le note no — sparirebbero per
 *  sempre perché qualcuno ha corretto un refuso in `quantita`. */
export function statoIniziale(
  pg: Personaggio,
  sheetVersion: string,
  precedente?: StatoSessione,
): StatoSessione {
  const oggettiAggiunti = precedente?.oggettiAggiunti ?? [];
  const sopravvissuti = new Set(oggettiAggiunti.map((o) => o.id));
  return {
    schemaVersion: SCHEMA_VERSION,
    sheetVersion,
    pf: pg.pfMax,
    pfTemporanei: 0,
    dadiVitaSpesi: 0,
    statoVitale: 'cosciente',
    tsMorte: { successi: 0, fallimenti: 0 },
    slotSpesi: Object.fromEntries(pg.slot.map((s) => [s.livello, []])),
    risorseUsate: Object.fromEntries(pg.risorse.map((r) => [r.id, []])),
    preparati: [...pg.preparatiIniziali],
    monete: { ...pg.monete },
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    note: precedente?.note ?? '',
    ispirazione: false,
    oggettiAggiunti,
    // Gli effetti no: durano minuti, e non si riaccende da soli quel che il
    // giocatore ha lasciato acceso due build fa.
    effetti: [],
    // Un indossato senza il suo oggetto è un id appeso nel vuoto.
    indossati: (precedente?.indossati ?? []).filter((id) => sopravvissuti.has(id)),
    esaurimento: 0,
    aggiornatoIl: adesso(),
  };
}
```

6. La migrazione, subito dopo `migraDa3`:

```ts
/** Dallo schema 4 al 5: la più facile della catena. Quattro campi che prima non
 *  esistevano, quindi vuoti — non c'è niente da indovinare e niente da
 *  azzerare. */
function migraDa4(v4: StatoSessione): StatoSessione {
  return {
    ...v4,
    schemaVersion: SCHEMA_VERSION,
    oggettiAggiunti: [],
    effetti: [],
    indossati: [],
    esaurimento: 0,
  };
}
```

7. Dentro `carica`, la riga del mismatch e la catena:

```ts
if (salvato?.sheetVersion !== sheetVersion) {
  return { stato: statoIniziale(pg, sheetVersion, salvato), azzerato: true };
}
```

```ts
if (stato.schemaVersion === 2) stato = migraDa2(stato);
if (stato.schemaVersion === 3) stato = migraDa3(stato, pg);
if (stato.schemaVersion === 4) stato = migraDa4(stato);
```

8. `migraDa3` chiudeva con `schemaVersion: SCHEMA_VERSION`, che adesso sarebbe un salto: diventa `schemaVersion: 4`, così la catena resta una catena.

```ts
return { ...v3, schemaVersion: 4, risorseUsate };
```

- [ ] **Step 5: lanciare i test e vederli passare**

Run: `npx vitest run src/lib/__tests__/sheet-state.test.ts`
Expected: PASS — le vecchie asserzioni comprese: `migraDa3` che ora torna 4 deve comunque arrivare a 5 attraverso `migraDa4`.

- [ ] **Step 6: il cancello e il commit**

```bash
npm run gate
git add src/lib/effetti.ts src/lib/oggetti.ts src/lib/sheet-state.ts src/lib/__tests__/sheet-state.test.ts
git commit -m "feat: carry table-side items across a data change

Schema 5: effetti, oggetti aggiunti, indossati, esaurimento. La
migrazione dalla 4 è quattro campi vuoti, e si aggancia alla catena
invece di aprire una strada nuova.

Gli oggetti raccolti al tavolo e le note sopravvivono all'azzeramento:
sono le uniche cose nello stato di cui l'autore è il giocatore, e
sparivano per sempre perché qualcuno correggeva un refuso in quantita.
Gli effetti no — durano minuti, e fra due build ne passano di più.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: accendere e spegnere gli effetti

I mutatori, con la regola che questa funzionalità esiste per far rispettare: **una concentrazione alla volta**.

**Files:**

- Modify: `src/lib/effetti.ts`
- Test: `src/lib/__tests__/effetti.test.ts`

**Interfaces:**

- Consumes: `Effetto` e `StatoSessione` (Task 2), `aggiorna` da `@/lib/sheet-state`.
- Produces:
  - `export function nuovoIdEffetto(): string`
  - `export function spentoDa(s: StatoSessione, nuovo: { concentrazione: boolean }): Effetto | null`
  - `export function accendiEffetto(s: StatoSessione, nuovo: Effetto): StatoSessione`
  - `export function spegniEffetto(s: StatoSessione, id: string): StatoSessione`
  - `export function spegniTuttiGliEffetti(s: StatoSessione): StatoSessione`
  - `export function impostaEsaurimento(s: StatoSessione, livelli: number): StatoSessione`

- [ ] **Step 1: scrivere il test che fallisce**

Crea `src/lib/__tests__/effetti.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale, type StatoSessione } from '@/lib/sheet-state';
import {
  accendiEffetto,
  impostaEsaurimento,
  nuovoIdEffetto,
  spegniEffetto,
  spegniTuttiGliEffetti,
  spentoDa,
  type Effetto,
} from '@/lib/effetti';

const pg = caricaPersonaggioDaFile();
let s: StatoSessione;

beforeEach(() => {
  s = statoIniziale(pg, 'v-test');
});

const effetto = (parti: Partial<Effetto>): Effetto => ({
  id: nuovoIdEffetto(),
  nome: 'Benedizione',
  durata: '1 minuto',
  concentrazione: false,
  modifiche: [],
  accesoIl: new Date().toISOString(),
  ...parti,
});

describe('accendere', () => {
  it('un effetto entra nella lista', () => {
    s = accendiEffetto(s, effetto({ nome: 'Scudo della Fede' }));
    expect(s.effetti.map((e) => e.nome)).toEqual(['Scudo della Fede']);
  });

  it('due effetti senza concentrazione convivono', () => {
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    expect(s.effetti).toHaveLength(2);
  });

  it('gli id sono diversi anche accendendo due volte di fila', () => {
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    s = accendiEffetto(s, effetto({ nome: 'Spaventato' }));
    expect(s.effetti[0].id).not.toBe(s.effetti[1].id);
  });
});

describe('la concentrazione è una sola', () => {
  it('accenderne una seconda spegne la prima', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    s = accendiEffetto(s, effetto({ nome: 'Silenzio', concentrazione: true }));
    expect(s.effetti.map((e) => e.nome)).toEqual(['Silenzio']);
  });

  it('non porta via gli effetti che non concentrano', () => {
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    s = accendiEffetto(s, effetto({ nome: 'Silenzio', concentrazione: true }));
    expect(s.effetti.map((e) => e.nome)).toEqual(['Santuario', 'Silenzio']);
  });

  it('«chi si spegne» si sa prima di accendere, non dopo', () => {
    // Una regola applicata di nascosto è indistinguibile da un errore: chi
    // accende deve poterlo dire *mentre* lo dice, non scoprirlo dopo.
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    expect(spentoDa(s, { concentrazione: true })?.nome).toBe('Benedizione');
    expect(spentoDa(s, { concentrazione: false })).toBeNull();
  });

  it('senza niente acceso non si spegne niente', () => {
    expect(spentoDa(s, { concentrazione: true })).toBeNull();
  });
});

describe('rilanciare lo stesso incantesimo rinnova, non accumula', () => {
  it('due lanci della stessa origine lasciano una voce sola', () => {
    s = accendiEffetto(s, effetto({ nome: 'Santuario', origine: 'santuario' }));
    s = accendiEffetto(s, effetto({ nome: 'Santuario', origine: 'santuario' }));
    expect(s.effetti).toHaveLength(1);
  });

  it('gli effetti senza origine non si fondono fra loro', () => {
    // Due dosi di veleno diverse restano due righe: nessuna delle due dice di
    // essere la stessa cosa dell'altra.
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    s = accendiEffetto(s, effetto({ nome: 'Avvelenato' }));
    expect(s.effetti).toHaveLength(2);
  });
});

describe('spegnere', () => {
  it('per id', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione' }));
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    s = spegniEffetto(s, s.effetti[0].id);
    expect(s.effetti.map((e) => e.nome)).toEqual(['Santuario']);
  });

  it('un id che non c’è non cambia niente', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione' }));
    expect(spegniTuttiGliEffetti(spegniEffetto(s, 'eff:mai')).effetti).toEqual([]);
    expect(spegniEffetto(s, 'eff:mai').effetti).toHaveLength(1);
  });

  it('tutti insieme', () => {
    s = accendiEffetto(s, effetto({ nome: 'Benedizione', concentrazione: true }));
    s = accendiEffetto(s, effetto({ nome: 'Santuario' }));
    expect(spegniTuttiGliEffetti(s).effetti).toEqual([]);
  });
});

describe('esaurimento', () => {
  it('sale e scende', () => {
    expect(impostaEsaurimento(s, 3).esaurimento).toBe(3);
  });

  it('non scende sotto zero né sale sopra sei', () => {
    // Il sesto livello è la morte: oltre non c'è niente da rappresentare.
    expect(impostaEsaurimento(s, -1).esaurimento).toBe(0);
    expect(impostaEsaurimento(s, 9).esaurimento).toBe(6);
  });

  it('non è un effetto e non finisce nella loro lista', () => {
    s = impostaEsaurimento(s, 2);
    expect(s.effetti).toEqual([]);
    expect(spegniTuttiGliEffetti(s).esaurimento).toBe(2);
  });
});
```

- [ ] **Step 2: lanciarlo e vederlo fallire**

Run: `npx vitest run src/lib/__tests__/effetti.test.ts`
Expected: FAIL, «does not provide an export named 'accendiEffetto'».

- [ ] **Step 3: scrivere i mutatori**

In coda a `src/lib/effetti.ts`:

```ts
import { aggiorna, type StatoSessione } from './sheet-state';
```

(l'import va in cima al file, accanto a quello di `Modifica`. `sheet-state.ts` importa da qui **solo il tipo** `Effetto`, che si cancella in compilazione: nessun ciclo a runtime.)

```ts
let ultimo = 0;

/** Un id che non collide neanche accendendo due effetti nello stesso
 *  millisecondo. Il contatore basta da solo: gli id non escono dalla sessione,
 *  e non li legge nessun altro. */
export function nuovoIdEffetto(): string {
  return `eff:${Date.now()}-${++ultimo}`;
}

/** Chi si spegnerebbe accendendo questo. Si chiede **prima** di accendere,
 *  perché la concentrazione esclusiva applicata in silenzio è indistinguibile
 *  da un difetto: al tavolo si vedrebbe sparire una riga senza sapere perché. */
export function spentoDa(s: StatoSessione, nuovo: { concentrazione: boolean }): Effetto | null {
  if (!nuovo.concentrazione) return null;
  return s.effetti.find((e) => e.concentrazione) ?? null;
}

export function accendiEffetto(s: StatoSessione, nuovo: Effetto): StatoSessione {
  // Rilanciare lo stesso incantesimo rinnova la durata, non accende un secondo
  // Santuario. Gli effetti senza origine non si fondono: due dosi di veleno
  // restano due righe, perché nessuna delle due dice di essere l'altra.
  let effetti = nuovo.origine
    ? s.effetti.filter((e) => e.origine !== nuovo.origine)
    : [...s.effetti];
  if (nuovo.concentrazione) effetti = effetti.filter((e) => !e.concentrazione);
  return aggiorna(s, { effetti: [...effetti, nuovo] });
}

export function spegniEffetto(s: StatoSessione, id: string): StatoSessione {
  return aggiorna(s, { effetti: s.effetti.filter((e) => e.id !== id) });
}

/** Quel che fanno entrambi i riposi. Non è una semplificazione: un riposo breve
 *  dura un'ora, e l'effetto più lungo che Kaelen sa produrre ne dura dieci
 *  minuti. L'esaurimento non è qui dentro — ha un campo suo e altre regole. */
export function spegniTuttiGliEffetti(s: StatoSessione): StatoSessione {
  return aggiorna(s, { effetti: [] });
}

export function impostaEsaurimento(s: StatoSessione, livelli: number): StatoSessione {
  return aggiorna(s, { esaurimento: Math.min(6, Math.max(0, Math.trunc(livelli))) });
}
```

- [ ] **Step 4: lanciare i test e vederli passare**

Run: `npx vitest run src/lib/__tests__/effetti.test.ts`
Expected: PASS, 15 test.

- [ ] **Step 5: il cancello e il commit**

```bash
npm run gate
git add src/lib/effetti.ts src/lib/__tests__/effetti.test.ts
git commit -m "feat: make concentration exclusive, and say so

Una concentrazione alla volta: accenderne una seconda spegne la prima.
spentoDa() risponde *prima* di accendere, perché una regola applicata di
nascosto è indistinguibile da un errore — al tavolo si vedrebbe sparire
una riga senza sapere perché.

Kaelen ha cinque incantesimi che si escludono a vicenda in una lista
dove niente lo dice: è la ragione più forte per cui questa roba esiste.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: gli oggetti aggiunti e i consumabili

I mutatori degli oggetti, e la vista che fonde le due sorgenti di consumabili in un elenco solo.

**Files:**

- Modify: `src/lib/oggetti.ts`
- Test: `src/lib/__tests__/oggetti.test.ts`

**Interfaces:**

- Consumes: `OggettoAggiunto` e `StatoSessione` (Task 2), `aggiorna` e `impostaOggetto` da `@/lib/sheet-state`, `Personaggio` da `@/lib/schema`.
- Produces:
  - `export const PREFISSO_MIO = 'mio:'`
  - `export function prossimoIdOggetto(s: StatoSessione): string`
  - `export function aggiungiOggetto(s: StatoSessione, dati: Omit<OggettoAggiunto, 'id'>): StatoSessione`
  - `export function impostaQuantitaAggiunta(s: StatoSessione, id: string, quantita: number): StatoSessione`
  - `export function rimuoviOggetto(s: StatoSessione, id: string): StatoSessione`
  - `export function commutaIndossato(s: StatoSessione, id: string): StatoSessione`
  - `export interface VoceConsumabile { id: string; nome: string; nomeEn?: string; nota?: string; quantita: number; mio: boolean }`
  - `export function consumabili(pg: Personaggio, s: StatoSessione): VoceConsumabile[]`
  - `export function consuma(s: StatoSessione, id: string): StatoSessione`
  - `export function restituisci(s: StatoSessione, id: string): StatoSessione`

- [ ] **Step 1: scrivere il test che fallisce**

Crea `src/lib/__tests__/oggetti.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale, type StatoSessione } from '@/lib/sheet-state';
import {
  PREFISSO_MIO,
  aggiungiOggetto,
  commutaIndossato,
  consuma,
  consumabili,
  impostaQuantitaAggiunta,
  prossimoIdOggetto,
  restituisci,
  rimuoviOggetto,
} from '@/lib/oggetti';

const pg = caricaPersonaggioDaFile();
let s: StatoSessione;

beforeEach(() => {
  s = statoIniziale(pg, 'v-test');
});

const pozione = {
  nome: 'Pozione di guarigione',
  quantita: 2,
  consumabile: true,
  nota: 'dal forziere · 2d4+2',
  modifiche: [],
};

describe('aggiungere', () => {
  it('l’oggetto entra con un id suo', () => {
    s = aggiungiOggetto(s, pozione);
    expect(s.oggettiAggiunti).toHaveLength(1);
    expect(s.oggettiAggiunti[0].id).toBe('mio:1');
    expect(s.oggettiAggiunti[0].nome).toBe('Pozione di guarigione');
  });

  it('gli id non collidono con quelli del repo, per costruzione', () => {
    // Il ':' non può comparire in uno slug, che viene dal nome di un file.
    s = aggiungiOggetto(s, pozione);
    for (const id of s.oggettiAggiunti.map((o) => o.id)) {
      expect(id.startsWith(PREFISSO_MIO)).toBe(true);
      expect(pg.equipaggiamento.some((e) => e.id === id)).toBe(false);
    }
  });

  it('il secondo oggetto non riusa l’id del primo, neanche dopo una rimozione', () => {
    // Riusare `mio:1` farebbe ricomparire indossato l'oggetto nuovo, perché
    // `indossati` porta gli id e non gli oggetti.
    s = aggiungiOggetto(s, pozione);
    s = aggiungiOggetto(s, { ...pozione, nome: 'Corda' });
    s = rimuoviOggetto(s, 'mio:1');
    s = aggiungiOggetto(s, { ...pozione, nome: 'Cintura' });
    expect(s.oggettiAggiunti.map((o) => o.id)).toEqual(['mio:2', 'mio:3']);
  });

  it('prossimoIdOggetto non consuma niente: dice solo quale sarà', () => {
    expect(prossimoIdOggetto(s)).toBe('mio:1');
    expect(prossimoIdOggetto(s)).toBe('mio:1');
  });
});

describe('quantità e rimozione', () => {
  beforeEach(() => {
    s = aggiungiOggetto(s, pozione);
  });

  it('la quantità si imposta e non scende sotto zero', () => {
    expect(impostaQuantitaAggiunta(s, 'mio:1', 5).oggettiAggiunti[0].quantita).toBe(5);
    expect(impostaQuantitaAggiunta(s, 'mio:1', -3).oggettiAggiunti[0].quantita).toBe(0);
  });

  it('rimuovere porta via anche l’indossato', () => {
    s = commutaIndossato(s, 'mio:1');
    expect(s.indossati).toEqual(['mio:1']);
    s = rimuoviOggetto(s, 'mio:1');
    expect(s.oggettiAggiunti).toEqual([]);
    expect(s.indossati).toEqual([]);
  });

  it('indossare è un interruttore', () => {
    expect(commutaIndossato(s, 'mio:1').indossati).toEqual(['mio:1']);
    expect(commutaIndossato(commutaIndossato(s, 'mio:1'), 'mio:1').indossati).toEqual([]);
  });
});

describe('i consumabili delle due sorgenti in un elenco solo', () => {
  it('prende quelli dei dati marcati consumabili, e nessun altro', () => {
    const elenco = consumabili(pg, s);
    expect(elenco.map((c) => c.id)).toEqual(['acqua-santa', 'razioni']);
    expect(elenco.every((c) => c.mio === false)).toBe(true);
  });

  it('la corda non è un consumabile e non sale in scheda', () => {
    expect(consumabili(pg, s).some((c) => c.id === 'corda')).toBe(false);
  });

  it('gli oggetti aggiunti marcati consumabili si accodano, marcati «miei»', () => {
    s = aggiungiOggetto(s, pozione);
    s = aggiungiOggetto(s, { nome: 'Cintura', quantita: 1, consumabile: false, modifiche: [] });
    const elenco = consumabili(pg, s);
    expect(elenco.map((c) => c.nome)).toEqual([
      'Fiala di acqua santa',
      'Razioni (giorni)',
      'Pozione di guarigione',
    ]);
    expect(elenco.at(-1)!.mio).toBe(true);
  });

  it('la quantità viene dallo stato, non dai dati', () => {
    s = { ...s, oggetti: { ...s.oggetti, razioni: 4 } };
    expect(consumabili(pg, s).find((c) => c.id === 'razioni')!.quantita).toBe(4);
  });
});

describe('consumare passa da una porta sola', () => {
  it('un consumabile del repo scende di uno', () => {
    s = consuma(s, 'acqua-santa');
    expect(s.oggetti['acqua-santa']).toBe(0);
  });

  it('un consumabile mio scende di uno', () => {
    s = aggiungiOggetto(s, pozione);
    s = consuma(s, 'mio:1');
    expect(s.oggettiAggiunti[0].quantita).toBe(1);
  });

  it('a zero non si scende sotto', () => {
    s = consuma(s, 'acqua-santa');
    expect(consuma(s, 'acqua-santa').oggetti['acqua-santa']).toBe(0);
  });

  it('restituire rimette esattamente quel che l’Annulla aveva tolto', () => {
    s = aggiungiOggetto(s, pozione);
    expect(restituisci(consuma(s, 'mio:1'), 'mio:1').oggettiAggiunti[0].quantita).toBe(2);
    expect(restituisci(consuma(s, 'razioni'), 'razioni').oggetti['razioni']).toBe(7);
  });
});
```

- [ ] **Step 2: lanciarlo e vederlo fallire**

Run: `npx vitest run src/lib/__tests__/oggetti.test.ts`
Expected: FAIL, «does not provide an export named 'aggiungiOggetto'».

- [ ] **Step 3: scrivere i mutatori**

In coda a `src/lib/oggetti.ts` (e in cima gli import: `import type { Personaggio } from './schema';` e `import { aggiorna, impostaOggetto, type StatoSessione } from './sheet-state';`):

```ts
/** Vedi il commento su `OggettoAggiunto.id`. Stessa forma e stessa ragione di
 *  `SPESA_MANUALE`. */
export const PREFISSO_MIO = 'mio:';

/** Il prossimo id libero. Non riusa quelli liberati da una rimozione: `indossati`
 *  porta gli id e non gli oggetti, e un `mio:1` riciclato farebbe ricomparire
 *  indossato l'oggetto nuovo. */
export function prossimoIdOggetto(s: StatoSessione): string {
  const numeri = s.oggettiAggiunti.map((o) => Number(o.id.slice(PREFISSO_MIO.length)) || 0);
  return `${PREFISSO_MIO}${Math.max(0, ...numeri) + 1}`;
}

export function aggiungiOggetto(
  s: StatoSessione,
  dati: Omit<OggettoAggiunto, 'id'>,
): StatoSessione {
  const oggetto: OggettoAggiunto = {
    ...dati,
    id: prossimoIdOggetto(s),
    quantita: Math.max(0, dati.quantita),
  };
  return aggiorna(s, { oggettiAggiunti: [...s.oggettiAggiunti, oggetto] });
}

export function impostaQuantitaAggiunta(
  s: StatoSessione,
  id: string,
  quantita: number,
): StatoSessione {
  return aggiorna(s, {
    oggettiAggiunti: s.oggettiAggiunti.map((o) =>
      o.id === id ? { ...o, quantita: Math.max(0, quantita) } : o,
    ),
  });
}

export function rimuoviOggetto(s: StatoSessione, id: string): StatoSessione {
  return aggiorna(s, {
    oggettiAggiunti: s.oggettiAggiunti.filter((o) => o.id !== id),
    // Un indossato senza il suo oggetto è un id appeso nel vuoto, e i suoi
    // modificatori resterebbero addosso a Kaelen per sempre.
    indossati: s.indossati.filter((x) => x !== id),
  });
}

export function commutaIndossato(s: StatoSessione, id: string): StatoSessione {
  const dentro = s.indossati.includes(id);
  return aggiorna(s, {
    indossati: dentro ? s.indossati.filter((x) => x !== id) : [...s.indossati, id],
  });
}

/** Una riga dell'elenco che sale in scheda, da qualunque delle due sorgenti
 *  venga. `mio` non è decorazione: è il filetto ambra sul fianco della carta,
 *  lo stesso segno che distingue il dominio fra le carte incantesimo. */
export interface VoceConsumabile {
  id: string;
  nome: string;
  nomeEn?: string;
  nota?: string;
  quantita: number;
  mio: boolean;
}

/** I consumabili delle due sorgenti in un elenco solo, i dati prima.
 *  `consumabile` era una bandiera morta: ogni voce di `equipaggiamento` la
 *  portava, lo schema la validava, e nessuna interfaccia la leggeva. Il gancio
 *  era già pagato. */
export function consumabili(pg: Personaggio, s: StatoSessione): VoceConsumabile[] {
  return [
    ...pg.equipaggiamento
      .filter((e) => e.consumabile)
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        nomeEn: e.nomeEn,
        nota: e.note,
        quantita: s.oggetti[e.id] ?? 0,
        mio: false,
      })),
    ...s.oggettiAggiunti
      .filter((o) => o.consumabile)
      .map((o) => ({ id: o.id, nome: o.nome, nota: o.nota, quantita: o.quantita, mio: true })),
  ];
}

/** Una porta sola per spendere, qualunque sia la sorgente: la striscia Annulla
 *  non deve sapere se quel che è stato bevuto veniva dal manuale o dal forziere. */
export function consuma(s: StatoSessione, id: string): StatoSessione {
  if (id.startsWith(PREFISSO_MIO)) {
    const o = s.oggettiAggiunti.find((x) => x.id === id);
    return o ? impostaQuantitaAggiunta(s, id, o.quantita - 1) : s;
  }
  return impostaOggetto(s, id, (s.oggetti[id] ?? 0) - 1);
}

/** L'inverso esatto, per la striscia Annulla. */
export function restituisci(s: StatoSessione, id: string): StatoSessione {
  if (id.startsWith(PREFISSO_MIO)) {
    const o = s.oggettiAggiunti.find((x) => x.id === id);
    return o ? impostaQuantitaAggiunta(s, id, o.quantita + 1) : s;
  }
  return impostaOggetto(s, id, (s.oggetti[id] ?? 0) + 1);
}
```

- [ ] **Step 4: lanciare i test e vederli passare**

Run: `npx vitest run src/lib/__tests__/oggetti.test.ts`
Expected: PASS, 14 test.

- [ ] **Step 5: il cancello e il commit**

```bash
npm run gate
git add src/lib/oggetti.ts src/lib/__tests__/oggetti.test.ts
git commit -m "feat: pick up items the repo will never know about

Un forziere non si apre con una pull request: gli oggetti trovati al
tavolo vivono nello stato, con id prefissati «mio:» — il ':' non può
comparire in uno slug, quindi la collisione è impossibile per
costruzione e non per fortuna.

consumabili() fonde le due sorgenti in un elenco solo, e consuma() è la
porta unica da cui passa la spesa: la striscia Annulla non deve sapere
se quel che è stato bevuto veniva dal manuale o dal forziere.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: il motore

Kaelen com'è in questo momento. Il pezzo su cui poggia tutto il resto, e l'unico che rende inutile scrivere aritmetica nuova: `derive.ts` non cambia di una riga, riceve un personaggio diverso.

**Files:**

- Create: `src/lib/adesso.ts`
- Test: `src/lib/__tests__/adesso.test.ts`

**Interfaces:**

- Consumes: `Modifica`, `VoceFinale`, `componiPunteggi`, `componiVoci` (Task 1); `StatoSessione` (Task 2).
- Produces:
  - `export interface Adesso { pg: Personaggio; voci: Record<VoceFinale, number>; promemoria: string[] }`
  - `export function modificheEsaurimento(livelli: number): Modifica[]`
  - `export function kaelenAdesso(pg: Personaggio, s: StatoSessione): Adesso`
  - `export function riassuntoVoci(voci: Record<VoceFinale, number>): string | null`

- [ ] **Step 1: scrivere il test che fallisce**

Crea `src/lib/__tests__/adesso.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { statoIniziale, type StatoSessione } from '@/lib/sheet-state';
import { accendiEffetto, impostaEsaurimento, nuovoIdEffetto } from '@/lib/effetti';
import { aggiungiOggetto, commutaIndossato } from '@/lib/oggetti';
import { kaelenAdesso, modificheEsaurimento, riassuntoVoci } from '@/lib/adesso';
import {
  bonusAbilita,
  bonusTiroSalvezza,
  capacitaTrasporto,
  cdIncantesimi,
  classeArmatura,
  dannoTesto,
  modificatore,
  perColpire,
} from '@/lib/derive';
import type { Modifica } from '@/lib/modifiche';

const pg = caricaPersonaggioDaFile();
let s: StatoSessione;

beforeEach(() => {
  s = statoIniziale(pg, 'v-test');
});

const effetto = (nome: string, modifiche: Modifica[], parti = {}) => ({
  id: nuovoIdEffetto(),
  nome,
  durata: '10 minuti',
  concentrazione: false,
  modifiche,
  accesoIl: new Date().toISOString(),
  ...parti,
});

describe('a mani vuote non cambia niente', () => {
  it('senza effetti, senza indossati e senza esaurimento Kaelen è quello dei dati', () => {
    const a = kaelenAdesso(pg, s);
    expect(a.pg.caratteristiche).toEqual(pg.caratteristiche);
    expect(a.voci).toEqual({ ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 });
    expect(a.promemoria).toEqual([]);
  });

  it('lo stato appena nato non fa esplodere niente', () => {
    // Le isole montano prima che il segnale sia inizializzato: `stato.value`
    // parte da `{}`. Non è teoria — è come si rompe una pagina intera.
    expect(() => kaelenAdesso(pg, {} as StatoSessione)).not.toThrow();
  });
});

describe('un punteggio cambia sei numeri, e nessuno li ha riscritti', () => {
  it('la Forza a 20 si propaga a tutto ciò che dalla Forza dipende', () => {
    s = aggiungiOggetto(s, {
      nome: 'Cintura di Forza',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
    });
    s = commutaIndossato(s, 'mio:1');
    const a = kaelenAdesso(pg, s);

    expect(a.pg.caratteristiche.for).toBe(20);
    expect(modificatore(a.pg.caratteristiche.for)).toBe(5);
    expect(perColpire(a.pg, 'maglio')).toBe(perColpire(pg, 'maglio') + 2);
    expect(dannoTesto(a.pg, 'maglio')).not.toBe(dannoTesto(pg, 'maglio'));
    expect(bonusTiroSalvezza(a.pg, 'for')).toBe(bonusTiroSalvezza(pg, 'for') + 2);
    expect(bonusAbilita(a.pg, 'Atletica')).toBe(bonusAbilita(pg, 'Atletica') + 2);
    expect(capacitaTrasporto(a.pg)).toBe(600);
  });

  it('l’oggetto che non porti addosso non modifica niente', () => {
    s = aggiungiOggetto(s, {
      nome: 'Cintura di Forza',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
    });
    expect(kaelenAdesso(pg, s).pg.caratteristiche.for).toBe(pg.caratteristiche.for);
  });

  it('un punteggio più basso di quello di base non lo abbassa', () => {
    // «Il punteggio diventa X» vale se non è già più alto. Kaelen ha Saggezza
    // 16: una cintura da 15 non lo peggiora.
    s = accendiEffetto(
      s,
      effetto('Cianfrusaglia', [{ genere: 'punteggio', bersaglio: 'sag', valore: 15 }]),
    );
    expect(kaelenAdesso(pg, s).pg.caratteristiche.sag).toBe(pg.caratteristiche.sag);
  });

  it('la CD degli incantesimi segue la Saggezza senza che nessuno la ricalcoli', () => {
    s = accendiEffetto(
      s,
      effetto('Dono di Talos', [{ genere: 'punteggio', bersaglio: 'sag', valore: 20 }]),
    );
    expect(cdIncantesimi(kaelenAdesso(pg, s).pg)).toBe(cdIncantesimi(pg) + 2);
  });
});

describe('la trappola della CA', () => {
  it('la CA di base resta quella di pg.armatura, non la tocca nessuno', () => {
    // `pg.armatura` è l'unica sorgente della CA di base: cotta di maglia e
    // scudo ci sono già dentro, e compaiono *anche* in `equipaggiamento`. Un
    // oggetto indossato dichiara solo il **delta**.
    s = aggiungiOggetto(s, {
      nome: 'Scudo +1',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 1 }],
    });
    s = commutaIndossato(s, 'mio:1');
    const a = kaelenAdesso(pg, s);

    expect(classeArmatura(a.pg)).toBe(classeArmatura(pg));
    expect(classeArmatura(a.pg) + a.voci.ca).toBe(classeArmatura(pg) + 1);
  });

  it('uno scudo magico scritto come «CA 2» conterebbe due volte', () => {
    // Questa è la guardia che dichiara il vincolo. Il numero plausibile è
    // esattamente il problema: entrambe le strade producono una CA credibile,
    // e nessun altro test se ne accorgerebbe.
    const sbagliato = { genere: 'voce', bersaglio: 'ca', valore: 2 } as const;
    s = aggiungiOggetto(s, {
      nome: 'Scudo +1 dichiarato male',
      quantita: 1,
      consumabile: false,
      modifiche: [sbagliato],
    });
    s = commutaIndossato(s, 'mio:1');
    const a = kaelenAdesso(pg, s);
    // Con lo scudo già contato in `pg.armatura.scudo`, il totale sale di due
    // invece che di uno: 20 invece di 19.
    expect(classeArmatura(a.pg) + a.voci.ca).toBe(classeArmatura(pg) + 2);
  });

  it('Scudo della Fede e uno scudo magico si sommano, ed è corretto', () => {
    s = accendiEffetto(
      s,
      effetto('Scudo della Fede', [{ genere: 'voce', bersaglio: 'ca', valore: 2 }]),
    );
    s = aggiungiOggetto(s, {
      nome: 'Scudo +1',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 1 }],
    });
    s = commutaIndossato(s, 'mio:1');
    expect(kaelenAdesso(pg, s).voci.ca).toBe(3);
  });
});

describe('esaurimento', () => {
  it('un livello è −2 a ogni prova col d20 e −5 piedi', () => {
    expect(modificheEsaurimento(1)).toEqual([
      { genere: 'voce', bersaglio: 'prove', valore: -2 },
      { genere: 'voce', bersaglio: 'ts', valore: -2 },
      { genere: 'voce', bersaglio: 'colpire', valore: -2 },
      { genere: 'voce', bersaglio: 'velocita', valore: -5 },
    ]);
  });

  it('a zero non produce niente', () => {
    expect(modificheEsaurimento(0)).toEqual([]);
  });

  it('i livelli si moltiplicano e arrivano nelle voci', () => {
    s = impostaEsaurimento(s, 3);
    const a = kaelenAdesso(pg, s);
    expect(a.voci.prove).toBe(-6);
    expect(a.voci.ts).toBe(-6);
    expect(a.voci.colpire).toBe(-6);
    expect(a.voci.velocita).toBe(-15);
  });
});

describe('i promemoria', () => {
  it('raccoglie quel che non diventa un numero', () => {
    s = accendiEffetto(s, effetto('Benedizione', [], { promemoria: '+1d4 a colpire e ai TS' }));
    expect(kaelenAdesso(pg, s).promemoria).toEqual(['+1d4 a colpire e ai TS']);
  });

  it('un effetto senza promemoria non lascia una riga vuota', () => {
    s = accendiEffetto(
      s,
      effetto('Scudo della Fede', [{ genere: 'voce', bersaglio: 'ca', valore: 2 }]),
    );
    expect(kaelenAdesso(pg, s).promemoria).toEqual([]);
  });
});

describe('il riassunto delle voci che nessun portale riscrive', () => {
  it('a voci intonse non dice niente', () => {
    expect(riassuntoVoci({ ca: 0, ts: 0, colpire: 0, prove: 0, velocita: 0 })).toBeNull();
  });

  it('la CA non entra: quella un portale la riscrive davvero', () => {
    expect(riassuntoVoci({ ca: 2, ts: 0, colpire: 0, prove: 0, velocita: 0 })).toBeNull();
  });

  it('dice in parole gli addendi che i numeri in pagina non portano', () => {
    expect(riassuntoVoci({ ca: 0, ts: -2, colpire: -2, prove: -2, velocita: -5 })).toBe(
      '−2 alle prove · −2 ai TS · −2 a colpire · −5 ft di velocità',
    );
  });

  it('usa il meno tipografico, non il trattino', () => {
    // «-2» col trattino da tastiera in mezzo ai numeri della scheda si legge
    // come una sillabazione.
    expect(riassuntoVoci({ ca: 0, ts: -1, colpire: 0, prove: 0, velocita: 0 })).toContain('−1');
  });

  it('un addendo positivo porta il più', () => {
    expect(riassuntoVoci({ ca: 0, ts: 1, colpire: 0, prove: 0, velocita: 0 })).toBe('+1 ai TS');
  });
});
```

- [ ] **Step 2: lanciarlo e vederlo fallire**

Run: `npx vitest run src/lib/__tests__/adesso.test.ts`
Expected: FAIL, «Failed to resolve import "@/lib/adesso"».

- [ ] **Step 3: scrivere il motore**

Crea `src/lib/adesso.ts`:

```ts
import type { Personaggio } from './schema';
import type { StatoSessione } from './sheet-state';
import { componiPunteggi, componiVoci, type Modifica, type VoceFinale } from './modifiche';

/** Kaelen com'è **in questo momento**.
 *
 *  `pg` è il personaggio dei dati con i punteggi già riscritti: tutto il resto
 *  della scheda continua a chiamare `derive.ts` come prima, solo su questo
 *  invece che sull'originale. È il motivo per cui `derive.ts` non cambia di una
 *  riga — `classeArmatura`, `perColpire`, `cdIncantesimi`, `capacitaTrasporto`
 *  non leggono altro che `pg`, e con la Forza a venti restituiscono sei numeri
 *  aggiornati senza una riga di aritmetica nuova.
 *
 *  `voci` sono gli addendi da applicare ai numeri già stampati. `promemoria` è
 *  quel che non diventa un numero e va detto in parole.
 *
 *  Tre sorgenti alimentano lo stesso calcolo: gli effetti temporanei, gli
 *  oggetti indossati, l'esaurimento. Hanno durate diverse e producono modifiche
 *  identiche, e una strada sola perché due strade per lo stesso numero sono due
 *  strade che prima o poi divergono. */
export interface Adesso {
  pg: Personaggio;
  voci: Record<VoceFinale, number>;
  promemoria: string[];
}

/** PHB 2024: ogni livello di esaurimento è −2 a ogni prova col d20 — prove,
 *  tiri salvezza e tiri per colpire — e −5 piedi di velocità. Tocca cinque voci
 *  insieme, ed è per questo che a mano si sbaglia sempre. */
export function modificheEsaurimento(livelli: number): Modifica[] {
  if (livelli <= 0) return [];
  return [
    { genere: 'voce', bersaglio: 'prove', valore: -2 * livelli },
    { genere: 'voce', bersaglio: 'ts', valore: -2 * livelli },
    { genere: 'voce', bersaglio: 'colpire', valore: -2 * livelli },
    { genere: 'voce', bersaglio: 'velocita', valore: -5 * livelli },
  ];
}

export function kaelenAdesso(pg: Personaggio, s: StatoSessione): Adesso {
  // I ripieghi non sono pedanteria: le isole montano prima che il segnale sia
  // inizializzato, e `stato.value` parte da un oggetto vuoto.
  const effetti = s.effetti ?? [];
  const indossati = new Set(s.indossati ?? []);
  const daOggetti = (s.oggettiAggiunti ?? [])
    .filter((o) => indossati.has(o.id) && o.quantita > 0)
    .flatMap((o) => o.modifiche);

  const tutte = [
    ...effetti.flatMap((e) => e.modifiche),
    ...daOggetti,
    ...modificheEsaurimento(s.esaurimento ?? 0),
  ];

  const caratteristiche = { ...pg.caratteristiche };
  for (const [chiave, valore] of Object.entries(componiPunteggi(tutte))) {
    const c = chiave as keyof typeof caratteristiche;
    // «Il punteggio diventa X» vale se non è già più alto: una cintura da
    // quindici non peggiora una Saggezza da sedici.
    caratteristiche[c] = Math.max(caratteristiche[c], valore as number);
  }

  return {
    pg: { ...pg, caratteristiche },
    voci: componiVoci(tutte),
    promemoria: effetti.map((e) => e.promemoria).filter((x): x is string => Boolean(x)),
  };
}

const ETICHETTE: [VoceFinale, string][] = [
  ['prove', 'alle prove'],
  ['ts', 'ai TS'],
  ['colpire', 'a colpire'],
];

/** Gli addendi che nessun numero in pagina porta, detti in parole.
 *
 *  Su `/scheda/` i portali riscrivono CA, CD e iniziativa: quelli si vedono. Le
 *  prove, i TS e i tiri per colpire stanno su venti carte diverse, e riscriverle
 *  tutte è una superficie che questa versione non apre. Una riga che dice
 *  «−2 alle prove» non mente; un numero base lasciato lì accanto a una riga che
 *  lo contraddice sarebbe peggio di entrambi. La CA è fuori dall'elenco proprio
 *  perché lì il portale c'è. */
export function riassuntoVoci(voci: Record<VoceFinale, number>): string | null {
  const pezzi = ETICHETTE.filter(([v]) => voci[v] !== 0).map(
    ([v, testo]) => `${segnoTipografico(voci[v])} ${testo}`,
  );
  if (voci.velocita !== 0) pezzi.push(`${segnoTipografico(voci.velocita)} ft di velocità`);
  return pezzi.length === 0 ? null : pezzi.join(' · ');
}

/** Il meno tipografico, non il trattino da tastiera: in mezzo ai numeri della
 *  scheda «-2» si legge come una sillabazione. Lo stesso segno che `Borsa` usa
 *  già sul bottone della quantità. */
function segnoTipografico(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}
```

- [ ] **Step 4: lanciare i test e vederli passare**

Run: `npx vitest run src/lib/__tests__/adesso.test.ts`
Expected: PASS, 17 test.

- [ ] **Step 5: il cancello e il commit**

```bash
npm run gate
git add src/lib/adesso.ts src/lib/__tests__/adesso.test.ts
git commit -m "feat: compute Kaelen as he is right now

kaelenAdesso() restituisce il personaggio con i punteggi riscritti, e
derive.ts non cambia di una riga: riceve un pg diverso. La Forza a venti
si propaga da sola a modificatore, colpire, danno, TS, Atletica e
capacità di trasporto.

pg.armatura resta l'unica sorgente della CA di base — cotta di maglia e
scudo ci sono già dentro — quindi un oggetto indossato dichiara solo il
delta. Un test dichiara il vincolo: «scudo, CA 2» conterebbe due volte,
e il totale sarebbe plausibile.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: i riposi spengono quel che è acceso

**Files:**

- Modify: `src/lib/sheet-state.ts` (`riposoBreve`, `riposoLungo`)
- Modify: `src/lib/riposi.ts` (`conseguenzaRiposo`)
- Test: `src/lib/__tests__/riposi.test.ts` (aggiunte in coda)

**Interfaces:**

- Consumes: `impostaEsaurimento`, `accendiEffetto`, `nuovoIdEffetto` (Task 3).
- Produces: nessuna firma nuova. `conseguenzaRiposo(s, pg, tipo)` guadagna righe.

- [ ] **Step 1: scrivere i test che falliscono**

Aggiungi in coda a `src/lib/__tests__/riposi.test.ts` (importa `accendiEffetto`, `nuovoIdEffetto`, `impostaEsaurimento` da `@/lib/effetti`, e `riposoBreve`/`riposoLungo` da `@/lib/sheet-state` se non ci sono già):

```ts
describe('i riposi e quel che è acceso', () => {
  const acceso = (s: StatoSessione, nome: string, concentrazione = false) =>
    accendiEffetto(s, {
      id: nuovoIdEffetto(),
      nome,
      durata: '10 minuti',
      concentrazione,
      modifiche: [],
      accesoIl: new Date().toISOString(),
    });

  it('il riposo breve spegne tutti gli effetti', () => {
    // Non è una semplificazione: un riposo breve dura un'ora, e l'effetto più
    // lungo che Kaelen sa produrre ne dura dieci minuti.
    let s = acceso(acceso(statoIniziale(pg, 'v'), 'Benedizione', true), 'Santuario');
    expect(riposoBreve(s, pg).effetti).toEqual([]);
  });

  it('il riposo lungo li spegne allo stesso modo', () => {
    let s = acceso(statoIniziale(pg, 'v'), 'Benedizione', true);
    expect(riposoLungo(s, pg).effetti).toEqual([]);
  });

  it('il riposo breve non tocca l’esaurimento', () => {
    const s = impostaEsaurimento(statoIniziale(pg, 'v'), 2);
    expect(riposoBreve(s, pg).esaurimento).toBe(2);
  });

  it('il riposo lungo ne toglie uno solo', () => {
    const s = impostaEsaurimento(statoIniziale(pg, 'v'), 3);
    expect(riposoLungo(s, pg).esaurimento).toBe(2);
  });

  it('a zero il riposo lungo non scende sotto', () => {
    expect(riposoLungo(statoIniziale(pg, 'v'), pg).esaurimento).toBe(0);
  });

  it('gli oggetti aggiunti e gli indossati non sono temporanei: i riposi non li guardano', () => {
    let s = aggiungiOggetto(statoIniziale(pg, 'v'), {
      nome: 'Cintura di Forza',
      quantita: 1,
      consumabile: false,
      modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
    });
    s = commutaIndossato(s, 'mio:1');
    const dopo = riposoLungo(s, pg);
    expect(dopo.oggettiAggiunti).toHaveLength(1);
    expect(dopo.indossati).toEqual(['mio:1']);
  });
});

describe('cosa dice il riposo prima di premere', () => {
  it('conta gli effetti che si stanno per spegnere', () => {
    let s = statoIniziale(pg, 'v');
    s = accendiEffetto(s, {
      id: nuovoIdEffetto(),
      nome: 'Benedizione',
      durata: '1 minuto',
      concentrazione: true,
      modifiche: [],
      accesoIl: new Date().toISOString(),
    });
    expect(conseguenzaRiposo(s, pg, 'breve')).toContain('1 effetto attivo');
    expect(conseguenzaRiposo(s, pg, 'lungo')).toContain('1 effetto attivo');
  });

  it('al plurale dice «effetti attivi»', () => {
    let s = statoIniziale(pg, 'v');
    for (const nome of ['Avvelenato', 'Spaventato']) {
      s = accendiEffetto(s, {
        id: nuovoIdEffetto(),
        nome,
        durata: '1 minuto',
        concentrazione: false,
        modifiche: [],
        accesoIl: new Date().toISOString(),
      });
    }
    expect(conseguenzaRiposo(s, pg, 'breve')).toContain('2 effetti attivi');
  });

  it('il riposo lungo annuncia il livello di esaurimento che se ne va', () => {
    const s = impostaEsaurimento(statoIniziale(pg, 'v'), 2);
    expect(conseguenzaRiposo(s, pg, 'lungo')).toContain('Esaurimento 2 → 1');
    expect(conseguenzaRiposo(s, pg, 'breve')).not.toContain('Esaurimento 2 → 1');
  });

  it('un riposo breve con solo un effetto acceso non è più inutile', () => {
    // Prima diceva «niente da recuperare» e poi spegneva Benedizione: il
    // consenso informato al contrario.
    let s = statoIniziale(pg, 'v');
    s = accendiEffetto(s, {
      id: nuovoIdEffetto(),
      nome: 'Benedizione',
      durata: '1 minuto',
      concentrazione: true,
      modifiche: [],
      accesoIl: new Date().toISOString(),
    });
    expect(riposoInutile(s, pg, 'breve')).toBe(false);
  });
});
```

- [ ] **Step 2: lanciarli e vederli fallire**

Run: `npx vitest run src/lib/__tests__/riposi.test.ts`
Expected: FAIL — `riposoBreve` lascia gli effetti accesi e `conseguenzaRiposo` non nomina nulla.

- [ ] **Step 3: le righe nuove**

In `src/lib/sheet-state.ts`, dentro `riposoBreve`, la `patch` finale diventa:

```ts
// Entrambi i riposi spengono tutti gli effetti temporanei: un riposo breve
// dura un'ora, e l'effetto più lungo che Kaelen sa produrre ne dura dieci
// minuti. L'esaurimento non è un effetto e non sta in quella lista.
return aggiorna(s, { risorseUsate, effetti: [] });
```

In `riposoLungo`, dentro l'oggetto passato ad `aggiorna`, dopo `risorseUsate`:

```ts
    effetti: [],
    // Un livello, non tutti: è la regola, e toglierne di più farebbe di una
    // notte una cura.
    esaurimento: Math.max(0, (s.esaurimento ?? 0) - 1),
```

In `src/lib/riposi.ts`, dentro `conseguenzaRiposo`:

- nel ramo `lungo`, prima del `return righe`:

```ts
if ((s.esaurimento ?? 0) > 0) righe.push(`Esaurimento ${s.esaurimento} → ${s.esaurimento - 1}`);
const effetti = (s.effetti ?? []).length;
if (effetti > 0) righe.push(quanti(effetti, 'effetto attivo', 'effetti attivi'));
```

- nel ramo `breve`, il `return` diventa:

```ts
const righe = pg.risorse
  .filter((r) => r.recupero === 'breve' && (s.risorseUsate[r.id] ?? []).length > 0)
  .map((r) => {
    const usate = (s.risorseUsate[r.id] ?? []).length;
    return `${r.nome} ${r.max - usate}/${r.max} → ${r.max - usate + 1}/${r.max}`;
  });

// Anche il riposo breve spegne gli effetti, quindi anche lui deve dirlo: un
// «niente da recuperare» seguito da Benedizione che sparisce è il consenso
// informato al contrario.
const effetti = (s.effetti ?? []).length;
if (effetti > 0) righe.push(quanti(effetti, 'effetto attivo', 'effetti attivi'));
return righe;
```

- [ ] **Step 4: lanciare i test e vederli passare**

Run: `npx vitest run src/lib/__tests__/riposi.test.ts src/lib/__tests__/sheet-state.test.ts`
Expected: PASS.

- [ ] **Step 5: il cancello e il commit**

```bash
npm run gate
git add src/lib/sheet-state.ts src/lib/riposi.ts src/lib/__tests__/riposi.test.ts
git commit -m "feat: put out every effect at both rests, and announce it

Un riposo breve dura un'ora e l'effetto più lungo che Kaelen sa
produrre ne dura dieci minuti: spegnerli tutti non è una
semplificazione. Il riposo lungo toglie un livello di esaurimento,
il breve non lo tocca.

conseguenzaRiposo lo dice prima di premere: un «niente da recuperare»
seguito da Benedizione che sparisce era il consenso informato al
contrario.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: quali incantesimi lasciano qualcosa addosso

La decisione rimandata dalla spec, presa qui: **ogni incantesimo che richiede concentrazione**, più i tre che durano e lasciano uno stato su Kaelen.

La regola, e vale come commento nello schema: un incantesimo porta `effetto` se **(a)** richiede concentrazione — lo slot è di Kaelen qualunque sia il bersaglio, ed è la sola cosa che questa funzionalità esiste per far rispettare — oppure **(b)** dura più di Istantanea **e** lascia uno stato che può essere su Kaelen.

Restano fuori, e ognuno ha la sua ragione: le durate Istantanee (non c'è niente da tenere acceso); `aiuto` (alza i PF massimi, che sono un altro campo con altre regole di recupero — vedi «cosa non c'è» nella spec); `cecita-sordita` e `dardo-guidato` (stati su un bersaglio, senza concentrazione da tenere); `fiamma-perenne`, `riposo-tranquillo`, `taumaturgia`, `zona-di-verita` (oggetti accesi, cadaveri protetti, trucchi e zone: non sono stati di Kaelen).

Uno solo porta una `modifica` numerica: **Scudo della Fede**. Tutti gli altri sono promemoria, e va bene così — Guida è +1d4 su una prova, che è un dado e non un addendo.

**Files:**

- Modify: `src/lib/schema.ts`
- Modify: 19 file in `src/content/spells/`
- Test: `src/lib/__tests__/incantesimi.test.ts` (aggiunte in coda)

**Interfaces:**

- Consumes: `modificaSchema` da `@/lib/modifiche` (Task 1).
- Produces: `Incantesimo` guadagna `effetto?: { promemoria?: string; modifiche: Modifica[] }`.

- [ ] **Step 1: scrivere i test che falliscono**

Aggiungi in coda a `src/lib/__tests__/incantesimi.test.ts`:

```ts
describe('cosa resta addosso dopo il lancio', () => {
  const incantesimi = caricaIncantesimi();

  it('ogni incantesimo con concentrazione dichiara un effetto', () => {
    // È la ragione per cui la striscia esiste: lo slot di concentrazione è di
    // Kaelen qualunque sia il bersaglio. Un incantesimo che concentra e non ha
    // un effetto da accendere è un buco nella regola.
    const senza = [...incantesimi.entries()]
      .filter(([, m]) => m.concentrazione && !m.effetto)
      .map(([slug]) => slug);
    expect(senza).toEqual([]);
  });

  it('nessun incantesimo istantaneo lascia qualcosa acceso', () => {
    const assurdi = [...incantesimi.entries()]
      .filter(([, m]) => m.durata === 'Istantanea' && m.effetto)
      .map(([slug]) => slug);
    expect(assurdi).toEqual([]);
  });

  it('i tre senza concentrazione che durano sono dichiarati', () => {
    for (const slug of ['santuario', 'legame-protettivo', 'protezione-dai-veleni']) {
      expect(incantesimi.get(slug)?.effetto).toBeDefined();
    }
  });

  it('Scudo della Fede è l’unico che sposta un numero', () => {
    const conModifiche = [...incantesimi.entries()]
      .filter(([, m]) => (m.effetto?.modifiche.length ?? 0) > 0)
      .map(([slug]) => slug);
    expect(conModifiche).toEqual(['scudo-della-fede']);
    expect(incantesimi.get('scudo-della-fede')!.effetto!.modifiche).toEqual([
      { genere: 'voce', bersaglio: 'ca', valore: 2 },
    ]);
  });

  it('Benedizione non sposta nessun numero: dà un dado', () => {
    // Un dado non è un addendo. Sta nella striscia col suo promemoria e non
    // tocca niente.
    const benedizione = incantesimi.get('benedizione')!;
    expect(benedizione.effetto!.modifiche).toEqual([]);
    expect(benedizione.effetto!.promemoria).toContain('1d4');
  });

  it('Aiuto resta fuori: i PF massimi sono un altro giro', () => {
    expect(incantesimi.get('aiuto')?.effetto).toBeUndefined();
  });

  it('ogni effetto dichiarato dice almeno una delle due cose', () => {
    // Un effetto senza promemoria e senza modifiche è un chip che non dice
    // niente: occupa una riga in cima alla scheda per non ricordare nulla.
    for (const [slug, m] of incantesimi) {
      if (!m.effetto) continue;
      const dice = Boolean(m.effetto.promemoria) || m.effetto.modifiche.length > 0;
      expect(dice, `${slug} ha un effetto muto`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: lanciarli e vederli fallire**

Run: `npx vitest run src/lib/__tests__/incantesimi.test.ts`
Expected: FAIL — sedici slug nell'elenco `senza`.

- [ ] **Step 3: il campo nello schema**

In `src/lib/schema.ts`, in cima: `import { modificaSchema } from './modifiche';`

Dentro `incantesimoSchema`, dopo `rituale`:

```ts
  /** Quel che resta addosso dopo il lancio, se resta qualcosa.
   *
   *  Nome, durata e concentrazione non si ripetono qui: vengono
   *  dall'incantesimo, e ricopiarli sarebbe una seconda verità da tenere
   *  allineata. Qui c'è solo quel che l'incantesimo *fa*.
   *
   *  Lo porta ogni incantesimo che richiede concentrazione — lo slot è di
   *  Kaelen qualunque sia il bersaglio — più quelli che durano e lasciano uno
   *  stato che può essere su di lui. Restano fuori le durate Istantanee, gli
   *  stati che vivono su un bersaglio senza concentrazione da tenere, e Aiuto,
   *  che alza i PF massimi: un altro campo con altre regole di recupero. */
  effetto: z
    .object({
      /** Quel che non diventa un numero. Guida è +1d4 su una prova: un dado,
       *  non un addendo. */
      promemoria: z.string().optional(),
      modifiche: z.array(modificaSchema).default([]),
    })
    .optional(),
```

- [ ] **Step 4: i diciannove frontmatter**

Aggiungi in coda al frontmatter di ciascun file, prima del `---` di chiusura. Il rientro è quello YAML standard del progetto.

`scudo-della-fede.md` — l'unico con una modifica:

```yaml
effetto:
  modifiche:
    - { genere: voce, bersaglio: ca, valore: 2 }
```

`benedizione.md`:

```yaml
effetto:
  promemoria: '+1d4 ai tiri per colpire e ai tiri salvezza'
```

Gli altri diciassette, solo `promemoria`:

| file                                     | `promemoria`                                                          |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `arma-spirituale.md`                     | `Azione bonus per muoverla di 6 m e colpire di nuovo`                 |
| `blocca-persone.md`                      | `Il bersaglio ripete il TS a ogni suo turno`                          |
| `calmare-emozioni.md`                    | `Fino a 10 creature: niente ostilità, oppure indifferenza`            |
| `folata-di-vento.md`                     | `Azione bonus per ruotare la linea di vento`                          |
| `guida.md`                               | `+1d4 su una prova di caratteristica, una volta`                      |
| `iettatura.md`                           | `−1d4 ai tiri per colpire o ai TS del bersaglio`                      |
| `individuazione-del-magico.md`           | `Azione per vedere l'aura e la scuola di magia`                       |
| `individuazione-del-male-e-del-bene.md`  | `Sai dove sono, non chi sono: niente attraverso 30 cm di legno`       |
| `individuazione-di-veleni-e-malattie.md` | `Sai dove sono veleni, creature velenose e malattie`                  |
| `localizzare-oggetto.md`                 | `Senti la direzione finché resti entro 300 m`                         |
| `nube-di-nebbia.md`                      | `L'area è pesantemente oscurata, anche per te`                        |
| `potenziare-caratteristica.md`           | `Vantaggio sulle prove della caratteristica scelta`                   |
| `protezione-dal-male-e-dal-bene.md`      | `Svantaggio ai loro attacchi contro di te; niente charme né paura`    |
| `silenzio.md`                            | `Niente suoni nella sfera: niente incantesimi con componente verbale` |
| `santuario.md`                           | `Chi ti attacca fa un TS su Saggezza o cambia bersaglio`              |
| `legame-protettivo.md`                   | `Il legato prende +1 CA e +1 ai TS; tu prendi la sua stessa ferita`   |
| `protezione-dai-veleni.md`               | `Resistenza al veleno e vantaggio sui TS contro l'avvelenamento`      |

- [ ] **Step 5: lanciare i test e vederli passare**

Run: `npx vitest run src/lib/__tests__/incantesimi.test.ts`
Expected: PASS, 7 test nuovi.

- [ ] **Step 6: il cancello e il commit**

```bash
npm run gate
git add src/lib/schema.ts src/content/spells src/lib/__tests__/incantesimi.test.ts
git commit -m "feat: declare what each spell leaves behind

La regola, e un test che la tiene: lo porta ogni incantesimo che
richiede concentrazione — lo slot è di Kaelen qualunque sia il
bersaglio — più i tre che durano e lasciano uno stato su di lui.

Uno solo sposta un numero, Scudo della Fede. Tutti gli altri sono
promemoria: Guida è +1d4 su una prova, che è un dado e non un addendo.
Aiuto resta fuori — i PF massimi sono un altro campo con altre regole.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: la striscia degli effetti, e i numeri che cambiano

Il pezzo visibile. I chip stanno sotto i numeri che modificano: leggi venti, e sotto leggi perché. La fascia delle difese **resta statica** e l'isola ci scrive dentro per portale.

**Files:**

- Create: `src/islands/StrisciaEffetti.tsx`
- Test: `src/islands/__tests__/StrisciaEffetti.test.ts`
- Modify: `src/pages/scheda.astro`
- Modify: `src/styles/componenti.css`
- Modify: `src/pages/__tests__/scheda.test.ts` (aggiunte in coda)

**Interfaces:**

- Consumes: `kaelenAdesso`, `riassuntoVoci`, `Adesso` (Task 5); `accendiEffetto`, `spegniEffetto`, `spentoDa`, `impostaEsaurimento`, `nuovoIdEffetto` (Task 3); `stato`, `muta`, `datiIniziali`, `assicuraInizializzato` da `@/lib/storage`; `classeArmatura`, `cdIncantesimi`, `iniziativa`, `attaccoIncantesimi`, `segno` da `@/lib/derive`; `vociFinali`, `caratteristicheModificabili`, `type Modifica` da `@/lib/modifiche`.
- Produces: il markup portato dentro `[data-adesso]`, e la striscia dentro `.striscia-effetti-isola`.

**Le quattro chiavi di `data-adesso`.** `ca`, `cd`, `iniz`, `attacco-inc`. Ce ne può essere più di un nodo con la stessa chiave — la CD compare due volte, nella fascia e nella barra appiccicata degli incantesimi — e l'isola li tratta tutti allo stesso modo.

**Cosa questo task non riscrive, e perché.** Prove, tiri salvezza e tiri per colpire stanno su una ventina di carte diverse. Riscriverle tutte è una superficie che questa versione non apre: al loro posto la striscia mostra la riga di `riassuntoVoci`, che dice «−2 alle prove · −2 ai TS» in parole. Una riga che dice l'addendo non mente; un numero base lasciato accanto a una riga che lo contraddice sarebbe peggio di entrambi.

- [ ] **Step 1: scrivere il test che fallisce**

Crea `src/islands/__tests__/StrisciaEffetti.test.ts`:

```ts
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, render } from 'preact';
import StrisciaEffetti from '@/islands/StrisciaEffetti';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { muta, stato } from '@/lib/storage';
import { nuovoIdEffetto } from '@/lib/effetti';
import { classeArmatura, cdIncantesimi } from '@/lib/derive';

const pg = caricaPersonaggioDaFile();
const CA = classeArmatura(pg);
const CD = cdIncantesimi(pg);

let radice: HTMLDivElement;
const giro = () => new Promise((r) => setTimeout(r, 50));

const valore = (chiave: string) =>
  document.querySelector<HTMLElement>(`[data-adesso="${chiave}"]`)!.textContent;
const chip = (nome: string) =>
  [...document.querySelectorAll<HTMLElement>('.chip-effetto')].find((c) =>
    c.textContent?.includes(nome),
  );

const effetto = (nome: string, parti = {}) => ({
  id: nuovoIdEffetto(),
  nome,
  durata: '10 minuti',
  concentrazione: false,
  modifiche: [],
  accesoIl: '2026-08-20T10:00:00.000Z',
  ...parti,
});

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    // Il markup come lo scrive `scheda.astro`, ridotto all'osso. I numeri sono
    // quelli che il build stampa: senza JavaScript restano questi, e sono
    // giusti.
    `<div class="difese">` +
    `<div><span class="tenue">CA</span><span class="valore" data-adesso="ca">${CA}</span></div>` +
    `<div><span class="tenue">CD</span><span class="valore" data-adesso="cd">${CD}</span></div>` +
    `<div><span class="tenue">INIZ</span><span class="valore" data-adesso="iniz">+1</span></div>` +
    `</div>` +
    `<p class="tenue attacco-inc">Attacco <span data-adesso="attacco-inc">+5</span> · ` +
    `CD <span data-adesso="cd">${CD}</span></p>` +
    `<div class="striscia-effetti-isola"></div>`;

  muta((x) => ({ ...x, effetti: [], oggettiAggiunti: [], indossati: [], esaurimento: 0 }));

  radice = document.querySelector<HTMLElement>('.striscia-effetti-isola')! as HTMLDivElement;
  render(h(StrisciaEffetti, {}), radice);
  await giro();
});

afterEach(() => render(null, radice));

describe('a effetti spenti la pagina è quella del build', () => {
  it('i numeri restano identici a quelli stampati', () => {
    expect(valore('ca')).toBe(`${CA}`);
    expect(valore('cd')).toBe(`${CD}`);
  });

  it('non c’è nessun valore barrato da leggere', () => {
    expect(document.querySelector('.difese s')).toBeNull();
  });

  it('resta il solo «+»', () => {
    expect(document.querySelectorAll('.chip-effetto')).toHaveLength(0);
    expect(document.querySelector('.chip-aggiungi')).not.toBeNull();
  });
});

describe('un effetto che sposta un numero', () => {
  beforeEach(async () => {
    muta((x) => ({
      ...x,
      effetti: [
        effetto('Scudo della Fede', {
          concentrazione: true,
          modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 2 }],
        }),
      ],
    }));
    await giro();
  });

  it('la CA in pagina sale', () => {
    expect(valore('ca')).toContain(`${CA + 2}`);
  });

  it('il valore di base resta leggibile, barrato', () => {
    expect(document.querySelector('.difese s')?.textContent).toBe(`${CA}`);
  });

  it('gli altri numeri non si muovono e non si barrano', () => {
    expect(valore('cd')).toBe(`${CD}`);
    expect(document.querySelectorAll('.difese s')).toHaveLength(1);
  });

  it('il chip c’è, e dice che è concentrazione', () => {
    expect(chip('Scudo della Fede')).not.toBeUndefined();
    expect(chip('Scudo della Fede')!.classList.contains('concentrazione')).toBe(true);
  });
});

describe('la Saggezza cambia la CD in tutt’e due i posti', () => {
  it('la fascia e la barra appiccicata dicono lo stesso numero', async () => {
    // Lasciarne uno fuori significherebbe due numeri stantii nel punto della
    // pagina che si guarda mentre si sceglie cosa lanciare.
    muta((x) => ({
      ...x,
      effetti: [
        effetto('Dono', { modifiche: [{ genere: 'punteggio', bersaglio: 'sag', valore: 20 }] }),
      ],
    }));
    await giro();

    const tutti = [...document.querySelectorAll<HTMLElement>('[data-adesso="cd"]')];
    expect(tutti).toHaveLength(2);
    for (const nodo of tutti) expect(nodo.textContent).toContain(`${CD + 2}`);
  });
});

describe('spegnere', () => {
  it('il × sul chip toglie l’effetto e riporta il numero', async () => {
    muta((x) => ({
      ...x,
      effetti: [
        effetto('Scudo della Fede', {
          modifiche: [{ genere: 'voce', bersaglio: 'ca', valore: 2 }],
        }),
      ],
    }));
    await giro();

    chip('Scudo della Fede')!.querySelector<HTMLButtonElement>('button.spegni')!.click();
    await giro();

    expect(stato.value.effetti).toEqual([]);
    expect(valore('ca')).toBe(`${CA}`);
  });

  it('non passa dalla striscia Annulla: si annulla da sé', async () => {
    // Una striscia che copre lo schermo per una cosa che si disfa toccando il
    // × accanto è rumore.
    const { annullabile } = await import('@/lib/annulla');
    annullabile.value = null;
    muta((x) => ({ ...x, effetti: [effetto('Santuario')] }));
    await giro();
    chip('Santuario')!.querySelector<HTMLButtonElement>('button.spegni')!.click();
    await giro();
    expect(annullabile.value).toBeNull();
  });
});

describe('esaurimento', () => {
  it('a zero non ha un chip', async () => {
    expect(chip('Esaurimento')).toBeUndefined();
  });

  it('acceso, mostra il livello e dice in parole quel che nessun numero porta', async () => {
    muta((x) => ({ ...x, esaurimento: 2 }));
    await giro();
    expect(chip('Esaurimento')!.textContent).toContain('2');
    expect(document.querySelector('.promemoria-voci')!.textContent).toContain('−4 alle prove');
    expect(document.querySelector('.promemoria-voci')!.textContent).toContain('−10 ft');
  });

  it('l’iniziativa invece un portale ce l’ha, e scende', async () => {
    muta((x) => ({ ...x, esaurimento: 1 }));
    await giro();
    expect(valore('iniz')).toContain('-1');
  });

  it('si alza dalla modale: il riposo lungo lo abbassa, ma qualcosa deve alzarlo', async () => {
    const dialogo = document.querySelector('dialog.modulo-effetto') as HTMLDialogElement;
    Object.assign(dialogo, {
      showModal: () => dialogo.setAttribute('open', ''),
      close: () => dialogo.removeAttribute('open'),
    });
    document.querySelector<HTMLButtonElement>('.chip-aggiungi')!.click();
    await giro();

    document
      .querySelector<HTMLButtonElement>(
        '.esaurimento-passi button[aria-label="Un livello in più"]',
      )!
      .click();
    await giro();

    expect(stato.value.esaurimento).toBe(1);
    // E non finisce fra gli effetti: ha regole sue.
    expect(stato.value.effetti).toEqual([]);
  });

  it('il × sul suo chip toglie un livello, non lo azzera', async () => {
    muta((x) => ({ ...x, esaurimento: 3 }));
    await giro();
    chip('Esaurimento')!.querySelector<HTMLButtonElement>('button.spegni')!.click();
    await giro();
    expect(stato.value.esaurimento).toBe(2);
  });
});

describe('accendere dalla striscia', () => {
  const apri = async () => {
    const dialogo = document.querySelector('dialog.modulo-effetto') as HTMLDialogElement;
    Object.assign(dialogo, {
      showModal: () => dialogo.setAttribute('open', ''),
      close: () => dialogo.removeAttribute('open'),
    });
    document.querySelector<HTMLButtonElement>('.chip-aggiungi')!.click();
    await giro();
    return dialogo;
  };

  const scrivi = (selettore: string, testo: string) => {
    const campo = document.querySelector<HTMLInputElement>(selettore)!;
    campo.value = testo;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('nome e durata bastano per accendere', async () => {
    const dialogo = await apri();
    scrivi('input[name="nome"]', 'Avvelenato');
    scrivi('input[name="durata"]', 'finché non finisce');
    dialogo
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();

    expect(stato.value.effetti.map((e) => e.nome)).toEqual(['Avvelenato']);
  });

  it('senza nome non accende niente', async () => {
    const dialogo = await apri();
    dialogo
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();
    expect(stato.value.effetti).toEqual([]);
  });

  it('dice chi si spegne, prima di accendere', async () => {
    muta((x) => ({ ...x, effetti: [effetto('Benedizione', { concentrazione: true })] }));
    await giro();
    await apri();
    const casella = document.querySelector<HTMLInputElement>('input[name="concentrazione"]')!;
    casella.checked = true;
    casella.dispatchEvent(new Event('change', { bubbles: true }));
    await giro();

    expect(document.querySelector('.avviso-concentrazione')!.textContent).toContain('Benedizione');
  });
});
```

- [ ] **Step 2: lanciarlo e vederlo fallire**

Run: `npx vitest run src/islands/__tests__/StrisciaEffetti.test.ts`
Expected: FAIL, «Failed to resolve import "@/islands/StrisciaEffetti"».

- [ ] **Step 3: scrivere l'isola**

Crea `src/islands/StrisciaEffetti.tsx`:

```tsx
import { createPortal } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { kaelenAdesso, riassuntoVoci, type Adesso } from '@/lib/adesso';
import {
  accendiEffetto,
  impostaEsaurimento,
  nuovoIdEffetto,
  spegniEffetto,
  spentoDa,
} from '@/lib/effetti';
import { caratteristicheModificabili, vociFinali, type Modifica } from '@/lib/modifiche';
import { attaccoIncantesimi, cdIncantesimi, classeArmatura, iniziativa, segno } from '@/lib/derive';
import type { Personaggio } from '@/lib/schema';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

/** Un posto in cui il build ha già stampato un numero, e dove l'isola scrive
 *  quello vero quando i due differiscono. `base` è quel che c'era. */
type Innesto = { nodo: HTMLElement; chiave: string; base: string };

/** La striscia degli effetti, e i numeri che gli effetti spostano.
 *
 *  La fascia CA/CD/INIZ **non** diventa un'isola: il build continua a stampare
 *  i suoi numeri, che senza JavaScript restano giusti e sono quelli veri nel
 *  novanta per cento dei momenti. Questa isola li sovrascrive solo quando c'è
 *  qualcosa da sovrascrivere, per portale, cercando gli innesti per attributo —
 *  la tecnica che `Contatori` usa già con `[data-caselle]`. Così il vincolo
 *  tiene da entrambi i lati: l'isola non contiene contenuto statico, e il
 *  contenuto statico non finisce dentro un'isola.
 *
 *  I chip stanno sotto i numeri che modificano: leggi venti, e sotto leggi
 *  perché. La regola che questa roba esiste per far rispettare è la
 *  concentrazione, e la si rispetta solo se la si vede **senza aprire niente**. */
export default function StrisciaEffetti() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const adesso = kaelenAdesso(pg, s);
  const [innesti, setInnesti] = useState<Innesto[]>([]);
  const dialogo = useRef<HTMLDialogElement>(null);
  const [concentra, setConcentra] = useState(false);

  useEffect(() => {
    setInnesti(
      [...document.querySelectorAll<HTMLElement>('[data-adesso]')].map((nodo) => {
        const base = nodo.textContent ?? '';
        // Letto e poi portato via, una volta sola: da qui in poi in questo nodo
        // scrive Preact. Senza la ripulitura il portale *accoderebbe* il valore
        // nuovo accanto al vecchio, e la CA leggerebbe «1820».
        nodo.textContent = '';
        return { nodo, chiave: nodo.dataset.adesso ?? '', base };
      }),
    );
  }, []);

  function accendi(e: Event) {
    e.preventDefault();
    const modulo = e.currentTarget as HTMLFormElement;
    const dati = new FormData(modulo);
    const nome = String(dati.get('nome') ?? '').trim();
    // Un effetto senza nome è un chip muto in cima alla scheda.
    if (!nome) return;

    const modifiche: Modifica[] = [];
    const bersaglio = String(dati.get('bersaglio') ?? '');
    const valore = Number(dati.get('valore') ?? 0);
    if (bersaglio && valore) {
      modifiche.push(
        (caratteristicheModificabili as readonly string[]).includes(bersaglio)
          ? { genere: 'punteggio', bersaglio: bersaglio as 'for', valore }
          : { genere: 'voce', bersaglio: bersaglio as 'ca', valore },
      );
    }

    muta((x) =>
      accendiEffetto(x, {
        id: nuovoIdEffetto(),
        nome,
        durata: String(dati.get('durata') ?? '').trim() || 'finché non finisce',
        concentrazione: dati.get('concentrazione') === 'on',
        promemoria: String(dati.get('promemoria') ?? '').trim() || undefined,
        modifiche,
        accesoIl: new Date().toISOString(),
      }),
    );
    modulo.reset();
    setConcentra(false);
    dialogo.current?.close();
  }

  const spegnere = concentra ? spentoDa(s, { concentrazione: true }) : null;
  const riassunto = riassuntoVoci(adesso.voci);

  return (
    <>
      {innesti.map((i) => createPortal(<Numero innesto={i} adesso={adesso} />, i.nodo))}

      <div class="striscia-effetti">
        {(s.effetti ?? []).map((e) => (
          <span key={e.id} class={`chip-effetto${e.concentrazione ? ' concentrazione' : ''}`}>
            {/* Il cerchio pieno distingue la concentrazione a colpo d'occhio,
                senza far leggere una parola. */}
            {e.concentrazione && <i class="segno" aria-hidden="true" />}
            <span class="nome">{e.nome}</span>
            <span class="durata tenue">{e.durata}</span>
            <button
              type="button"
              class="spegni"
              aria-label={`Spegni ${e.nome}`}
              onClick={() => muta((x) => spegniEffetto(x, e.id))}
            >
              ×
            </button>
          </span>
        ))}

        {(s.esaurimento ?? 0) > 0 && (
          <span class="chip-effetto esaurimento">
            <span class="nome">Esaurimento {s.esaurimento}</span>
            <button
              type="button"
              class="spegni"
              aria-label="Un livello di esaurimento in meno"
              onClick={() => muta((x) => impostaEsaurimento(x, (x.esaurimento ?? 0) - 1))}
            >
              −
            </button>
          </span>
        )}

        <button
          type="button"
          class="chip-aggiungi"
          aria-label="Aggiungi un effetto"
          onClick={() => dialogo.current?.showModal()}
        >
          +
        </button>
      </div>

      {/* Gli addendi che nessun numero in pagina porta. Vedi `riassuntoVoci`:
          una riga che li dice non mente, un numero stantio sì. */}
      {riassunto && <p class="promemoria-voci tenue">{riassunto}</p>}
      {adesso.promemoria.map((p) => (
        <p key={p} class="promemoria-voci tenue">
          {p}
        </p>
      ))}

      <dialog class="modulo-effetto" ref={dialogo} aria-label="Aggiungi un effetto">
        <form onSubmit={accendi}>
          <label>
            Nome
            <input type="text" name="nome" required autocomplete="off" />
          </label>
          <label>
            Durata
            <input type="text" name="durata" placeholder="1 minuto" autocomplete="off" />
          </label>
          <label class="riga">
            <input
              type="checkbox"
              name="concentrazione"
              onChange={(ev) => setConcentra(ev.currentTarget.checked)}
            />
            Richiede concentrazione
          </label>
          {/* Detto prima di accendere, non dopo: una regola applicata di
              nascosto è indistinguibile da un errore. */}
          {spegnere && <p class="avviso-concentrazione">Accendendolo spegni «{spegnere.nome}».</p>}
          <label>
            Promemoria
            <input type="text" name="promemoria" placeholder="+1d4 ai TS" autocomplete="off" />
          </label>

          {/* Chiuso di default, come il `<details class="correzioni">` del
              pannello ⚡: il caso d'angolo si vede che lo è, e chi segna
              «avvelenato» non si trova davanti un pannello da artefatto. */}
          <details class="numeri">
            <summary>Sposta un numero?</summary>
            <div class="riga">
              <select name="bersaglio" aria-label="Cosa modifica">
                <option value="">niente</option>
                {caratteristicheModificabili.map((c) => (
                  <option key={c} value={c}>
                    {c.toUpperCase()} diventa
                  </option>
                ))}
                {vociFinali.map((v) => (
                  <option key={v} value={v}>
                    {v} ±
                  </option>
                ))}
              </select>
              <input type="number" name="valore" aria-label="Di quanto" value="0" />
            </div>
          </details>

          <div class="comandi">
            <button type="button" onClick={() => dialogo.current?.close()}>
              Annulla
            </button>
            <button type="submit">Accendi</button>
          </div>
        </form>

        {/* L'esaurimento non è un effetto e non entra nel modulo qui sopra: ha
            regole sue, un campo suo e un solo modo di scendere, che è il riposo
            lungo. Ma da qualche parte deve pur salire, e questa è la sede dove
            si dichiara quel che Kaelen si porta addosso. Fuori dal <form>,
            perché non c'è niente da inviare: ogni tocco scrive subito. */}
        <div class="esaurimento-passi">
          <span class="k">Esaurimento</span>
          <button
            type="button"
            aria-label="Un livello in meno"
            onClick={() => muta((x) => impostaEsaurimento(x, (x.esaurimento ?? 0) - 1))}
          >
            −
          </button>
          <span class="valore">{s.esaurimento ?? 0}</span>
          <button
            type="button"
            aria-label="Un livello in più"
            onClick={() => muta((x) => impostaEsaurimento(x, (x.esaurimento ?? 0) + 1))}
          >
            +
          </button>
          {/* Il sesto è la morte: dirlo qui costa una riga e vale la lettura. */}
          {(s.esaurimento ?? 0) >= 5 && <span class="tenue">al sesto si muore</span>}
        </div>
      </dialog>
    </>
  );
}

/** Il numero vero al posto di quello stampato, col valore di base barrato
 *  accanto quando i due differiscono. A effetti spenti rende esattamente il
 *  testo che c'era: la pagina è quella del build. */
function Numero({ innesto, adesso }: { innesto: Innesto; adesso: Adesso }) {
  const nuovo = calcola(innesto.chiave, adesso);
  // Niente da sovrascrivere: rende esattamente il testo che il build aveva
  // stampato, così la pagina a effetti spenti è quella di prima.
  if (nuovo === null || nuovo === innesto.base) return <>{innesto.base}</>;
  return (
    <>
      {nuovo}
      <s class="base">{innesto.base}</s>
    </>
  );
}

function calcola(chiave: string, a: Adesso): string | null {
  switch (chiave) {
    case 'ca':
      return `${classeArmatura(a.pg) + a.voci.ca}`;
    case 'cd':
      return `${cdIncantesimi(a.pg)}`;
    // L'iniziativa è una prova di Destrezza: l'esaurimento la tocca.
    case 'iniz':
      return segno(iniziativa(a.pg) + a.voci.prove);
    // Il tiro per colpire con un incantesimo è un tiro col d20 come gli altri.
    case 'attacco-inc':
      return segno(attaccoIncantesimi(a.pg) + a.voci.colpire);
    default:
      return null;
  }
}
```

`Personaggio` non serve più fra gli import di questo file: `Numero` legge solo
`adesso.pg`. Se ESLint segnala l'import inutilizzato, toglierlo.

- [ ] **Step 4: gli innesti nella pagina**

In `src/pages/scheda.astro`:

1. l'import: `import StrisciaEffetti from '@/islands/StrisciaEffetti';`

2. la fascia delle difese — solo tre attributi in più, il markup non cambia forma:

```astro
<div class="difese">
  <div><span class="tenue">CA</span><span class="valore" data-adesso="ca">{ca}</span></div>
  <div><span class="tenue">CD</span><span class="valore" data-adesso="cd">{cd}</span></div>
  <div>
    <span class="tenue">INIZ</span><span class="valore" data-adesso="iniz">{bonusIniziativa}</span>
  </div>
</div>

{
  /* I chip stanno sotto i numeri che modificano, non dentro una modale: la
    concentrazione la si rispetta solo se la si vede senza aprire niente. Il
    contenitore è statico e porta lui l'altezza riservata, come per la
    Vitalità — con `client:only` l'isola non rende nulla lato server. */
}
<div class="striscia-effetti-isola">
  <StrisciaEffetti client:only="preact" />
</div>
```

3. la riga di Attacco e CD dentro la barra appiccicata. Restano fuori dall'isola: il build li conosce già. Guadagnano solo l'innesto, perché dipendono dalla Saggezza e senza sarebbero due numeri stantii nel punto della pagina che si guarda mentre si sceglie cosa lanciare:

```astro
<p class="tenue attacco-inc">
  Attacco <span data-adesso="attacco-inc">{bonusIncantesimi}</span> · CD <span data-adesso="cd"
    >{cd}</span
  >
</p>
```

- [ ] **Step 5: il CSS**

In coda a `src/styles/componenti.css`, dopo il blocco `.difese`:

```css
/* La striscia degli effetti.
 *
 * L'altezza sta sul contenitore statico e non sulla striscia disegnata da
 * Preact: con `client:only` quella non esiste finché il JavaScript non gira, e
 * una riserva dichiarata lì varrebbe per un elemento assente — la pagina
 * salterebbe lo stesso. Stessa trappola già documentata su `.vitalita-isola`.
 *
 * 44px e non i 28 dello sketch: il × su un chip è un bersaglio per un dito
 * come tutti gli altri, e un chip alto 28 lo rende impossibile da centrare.
 * Il pallino visivo resta più basso, ci pensa l'imbottitura. */
.striscia-effetti-isola {
  min-height: 44px;
  margin-bottom: var(--spazio-2);
}

.striscia-effetti {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spazio-1);
}

.chip-effetto,
.chip-aggiungi {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--lampo);
  background: var(--lampo-fondo);
  color: var(--lampo-cupo);
  font-size: var(--fs-piccolo);
}

/* La concentrazione ha un colore suo e un cerchio pieno: è la sola cosa che
 * questa striscia esiste per non far dimenticare, e distinguerla per parola
 * vorrebbe dire farla leggere. */
.chip-effetto.concentrazione {
  border-color: var(--ambra);
  background: transparent;
  color: var(--ambra);
}

.chip-effetto.concentrazione .segno {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ambra);
}

.chip-effetto.esaurimento {
  border-color: var(--allerta);
  background: transparent;
  color: var(--allerta);
}

.chip-effetto .durata {
  font-family: var(--font-mono);
}

.chip-effetto .spegni {
  min-width: 44px;
  min-height: 44px;
  margin-right: -0.6rem;
  border: none;
  background: none;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

.chip-aggiungi {
  min-width: 44px;
  justify-content: center;
  border-style: dashed;
  border-color: var(--filetto);
  background: transparent;
  color: var(--inchiostro-muto);
  cursor: pointer;
}

.promemoria-voci {
  margin: 0 0 var(--spazio-1);
  font-size: var(--fs-piccolo);
}

/* Il valore di base non sparisce: barrato accanto a quello nuovo, così si vede
 * *da dove* viene il numero che stai leggendo. Se a 390px risulti solo sporco
 * lo dirà l'occhio, non un test. */
.difese s.base,
.attacco-inc s.base {
  margin-left: 0.3rem;
  font-size: var(--fs-piccolo);
  color: var(--ambra);
}

/* `display` solo da aperto: la regola base lo scavalcherebbe e il modulo
 * finirebbe dentro la pagina. C'è una guardia in altezze.test.ts. */
dialog.modulo-effetto {
  width: min(28rem, 100%);
  margin: auto;
  padding: var(--spazio-2) var(--spazio-2) calc(var(--spazio-2) + env(safe-area-inset-bottom, 0px));
  border: 1px solid var(--filetto);
  border-radius: var(--raggio-superficie);
  background: var(--carta);
  color: var(--inchiostro);
}

dialog.modulo-effetto[open] {
  display: block;
}

dialog.modulo-effetto::backdrop {
  background: rgb(0 0 0 / 0.6);
}

dialog.modulo-effetto label {
  display: grid;
  gap: 0.2rem;
  margin-bottom: var(--spazio-2);
  font-size: var(--fs-piccolo);
  color: var(--inchiostro-tenue);
}

dialog.modulo-effetto label.riga,
dialog.modulo-effetto .riga {
  display: flex;
  align-items: center;
  gap: var(--spazio-1);
}

dialog.modulo-effetto input,
dialog.modulo-effetto select {
  min-height: 44px;
  padding: 0 0.5rem;
  border: 1px solid var(--filetto);
  border-radius: var(--raggio);
  background: var(--superficie);
  color: var(--inchiostro);
  font: inherit;
}

dialog.modulo-effetto input[type='checkbox'] {
  min-height: 0;
  width: 22px;
  height: 22px;
}

.avviso-concentrazione {
  margin: 0 0 var(--spazio-2);
  font-size: var(--fs-piccolo);
  color: var(--ambra);
}

dialog.modulo-effetto .numeri summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  font-size: var(--fs-piccolo);
  color: var(--inchiostro-muto);
  cursor: pointer;
}

dialog.modulo-effetto .comandi {
  display: flex;
  justify-content: flex-end;
  gap: var(--spazio-1);
  margin-top: var(--spazio-2);
}

dialog.modulo-effetto .comandi button {
  min-height: 44px;
  padding: 0 var(--spazio-2);
  border: 1px solid var(--filetto);
  border-radius: var(--raggio);
  background: var(--superficie);
  color: var(--inchiostro);
  cursor: pointer;
}

/* Sta sotto i comandi e staccato da un filetto: è l'unica cosa in questa
 * modale che non riguarda l'effetto che stai scrivendo. */
.esaurimento-passi {
  display: flex;
  align-items: center;
  gap: var(--spazio-1);
  margin-top: var(--spazio-2);
  padding-top: var(--spazio-2);
  border-top: 1px solid var(--filetto);
}

.esaurimento-passi .k {
  flex: 1;
  font-size: var(--fs-piccolo);
  color: var(--inchiostro-muto);
}

.esaurimento-passi button {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--filetto);
  border-radius: var(--raggio);
  background: var(--superficie);
  color: var(--inchiostro);
  cursor: pointer;
}

.esaurimento-passi .valore {
  min-width: 1.5rem;
  text-align: center;
  font-family: var(--font-mono);
}
```

- [ ] **Step 6: la guardia sul costruito**

Aggiungi in coda a `src/pages/__tests__/scheda.test.ts`:

```ts
describe('la fascia delle difese resta statica', () => {
  it('i numeri li stampa il build, non l’isola', () => {
    const html = dist('scheda');
    // Senza JavaScript la CA si legge lo stesso, ed è giusta: è il caso normale.
    expect(html).toMatch(/data-adesso="ca"[^>]*>\d+</);
    expect(html).toMatch(/data-adesso="iniz"[^>]*>[+−-]\d+</);
  });

  it('la CD ha due innesti: la fascia e la barra appiccicata', () => {
    // Lasciarne uno fuori significherebbe un numero stantio nel punto della
    // pagina che si guarda mentre si sceglie cosa lanciare.
    const html = dist('scheda');
    expect([...html.matchAll(/data-adesso="cd"/g)]).toHaveLength(2);
    expect(html).toContain('data-adesso="attacco-inc"');
  });

  it('il contenitore della striscia riserva la sua altezza', () => {
    expect(dist('scheda')).toContain('class="striscia-effetti-isola"');
  });
});
```

- [ ] **Step 7: lanciare tutto e vederlo passare**

Run: `npm run build && npx vitest run src/islands/__tests__/StrisciaEffetti.test.ts src/pages/__tests__/scheda.test.ts src/styles/__tests__/altezze.test.ts`
Expected: PASS.

- [ ] **Step 8: il cancello e il commit**

```bash
npm run gate
git add src/islands/StrisciaEffetti.tsx src/islands/__tests__/StrisciaEffetti.test.ts src/pages/scheda.astro src/pages/__tests__/scheda.test.ts src/styles/componenti.css
git commit -m "feat: show the effects under the numbers they change

I chip stanno sotto la fascia CA/CD/INIZ: leggi venti, e sotto leggi
perché. La concentrazione ha un chip suo, ambra e col cerchio pieno,
perché la si rispetta solo se la si vede senza aprire niente.

La fascia non diventa un'isola. Il build continua a stampare i suoi
numeri — senza JavaScript restano giusti, ed è il caso normale — e
l'isola li sovrascrive per portale solo quando c'è qualcosa da
sovrascrivere, col valore di base barrato accanto. Vale anche per
Attacco e CD nella barra appiccicata, che dipendono dalla Saggezza.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: l'effetto proposto dal lancio

`ControlliLancio` è già il punto in cui dichiari di aver lanciato qualcosa. Dopo il lancio, se l'incantesimo lascia qualcosa addosso, la striscia Annulla propone di accenderlo. **Proposto, mai automatico**: si lancia Benedizione su un compagno e l'effetto non è su Kaelen.

**Files:**

- Modify: `src/components/CarteIncantesimo.astro` (tre attributi dati in più sul blocco di lancio)
- Modify: `src/islands/ControlliLancio.tsx`
- Modify: `src/styles/componenti.css`
- Test: `src/islands/__tests__/ControlliLancio.test.ts` (aggiunte in coda)

**Interfaces:**

- Consumes: `accendiEffetto`, `spentoDa`, `nuovoIdEffetto` (Task 3); `Incantesimo.effetto` (Task 7).
- Produces: dopo il lancio, un bottone «Tienilo acceso» dentro il blocco di lancio, e l'effetto nello stato con `origine` uguale allo slug.

**Come viaggia il dato.** Il testo dell'effetto non entra nel blocco `#dati-iniziali` — quello porta `pg` e il pool, non i frontmatter degli incantesimi. Viaggia sul blocco di lancio, che è già il posto da cui `ControlliLancio` legge slug, nome, livello e rituale:

```astro
<div
  data-lancio={m.slug}
  data-nome={m.nome}
  data-livello={m.livello}
  data-durata={m.durata}
  data-concentrazione={m.concentrazione ? '' : undefined}
  data-promemoria={m.effetto?.promemoria}
  data-modifiche={m.effetto ? JSON.stringify(m.effetto.modifiche) : undefined}
  ...
>
</div>
```

`data-modifiche` è assente quando l'incantesimo non lascia niente, ed è la sola bandiera che serve: se non c'è, non si propone nulla.

- [ ] **Step 1: scrivere il test che fallisce**

Aggiungi in coda a `src/islands/__tests__/ControlliLancio.test.ts` (il file monta già l'isola su un markup di lancio finto: estendere quel markup con gli attributi nuovi su almeno due incantesimi, uno con effetto e uno senza).

```ts
describe('l’effetto dopo il lancio', () => {
  const bloccoConEffetto = (slug: string, nome: string) =>
    `<div data-lancio="${slug}" data-nome="${nome}" data-livello="1" ` +
    `data-durata="10 minuti" data-concentrazione ` +
    `data-modifiche='[{"genere":"voce","bersaglio":"ca","valore":2}]'></div>`;

  it('non si accende da solo', async () => {
    // Si lancia Benedizione su un compagno e l'effetto non è su Kaelen.
    // Lanciare e accendere sono due gesti, e il secondo è una scelta.
    await lancia('scudo-della-fede', 1);
    expect(stato.value.effetti).toEqual([]);
  });

  it('appare un comando per tenerlo acceso', async () => {
    await lancia('scudo-della-fede', 1);
    expect(document.querySelector('.tieni-acceso')).not.toBeNull();
  });

  it('premendolo, l’effetto entra con l’origine del lancio', async () => {
    await lancia('scudo-della-fede', 1);
    document.querySelector<HTMLButtonElement>('.tieni-acceso')!.click();
    await giro();

    expect(stato.value.effetti).toHaveLength(1);
    expect(stato.value.effetti[0].origine).toBe('scudo-della-fede');
    expect(stato.value.effetti[0].durata).toBe('10 minuti');
    expect(stato.value.effetti[0].concentrazione).toBe(true);
    expect(stato.value.effetti[0].modifiche).toEqual([
      { genere: 'voce', bersaglio: 'ca', valore: 2 },
    ]);
  });

  it('un incantesimo che non lascia niente non propone niente', async () => {
    await lancia('cura-ferite', 1);
    expect(document.querySelector('.tieni-acceso')).toBeNull();
  });

  it('dice cosa spegnerà, prima che tu prema', async () => {
    muta((x) =>
      accendiEffetto(x, {
        id: nuovoIdEffetto(),
        nome: 'Benedizione',
        durata: '1 minuto',
        concentrazione: true,
        modifiche: [],
        accesoIl: '2026-08-20T10:00:00.000Z',
      }),
    );
    await lancia('scudo-della-fede', 1);
    expect(document.querySelector('.tieni-acceso')!.textContent).toContain('Benedizione');
  });

  it('rilanciarlo rinnova invece di accenderne due', async () => {
    await lancia('scudo-della-fede', 1);
    document.querySelector<HTMLButtonElement>('.tieni-acceso')!.click();
    await giro();
    await lancia('scudo-della-fede', 1);
    document.querySelector<HTMLButtonElement>('.tieni-acceso')!.click();
    await giro();

    expect(stato.value.effetti).toHaveLength(1);
  });
});
```

Nota: `lancia(slug, livello)` è un aiutante da scrivere nel file di test se non c'è già — trova il bottone «Lancia N°» dentro `[data-lancio="<slug>"]`, lo clicca, e attende un `giro()`. Il markup finto va esteso con `bloccoConEffetto('scudo-della-fede', 'Scudo della Fede')` e un blocco per `cura-ferite` **senza** `data-modifiche`.

- [ ] **Step 2: lanciarlo e vederlo fallire**

Run: `npx vitest run src/islands/__tests__/ControlliLancio.test.ts`
Expected: FAIL, `.tieni-acceso` non esiste.

- [ ] **Step 3: gli attributi sul blocco di lancio**

In `src/components/CarteIncantesimo.astro`, sul `<div data-lancio=…>`, aggiungi i quattro attributi dello snippet qui sopra. `data-concentrazione` senza valore quando c'è e `undefined` quando non c'è, come `data-rituale` che il file usa già.

- [ ] **Step 4: la proposta nell'isola**

In `src/islands/ControlliLancio.tsx`:

1. il tipo `Bersaglio` guadagna quattro campi:

```ts
type Bersaglio = {
  nodo: HTMLElement;
  slug: string;
  nome: string;
  livello: number;
  rituale: boolean;
  /** Assente quando l'incantesimo non lascia niente addosso. */
  durata?: string;
  concentrazione: boolean;
  promemoria?: string;
  modifiche?: Modifica[];
};
```

2. dentro l'effetto che li raccoglie, dopo `rituale`:

```ts
      durata: nodo.dataset.durata,
      concentrazione: nodo.dataset.concentrazione !== undefined,
      promemoria: nodo.dataset.promemoria,
      // Assente se l'incantesimo non lascia niente: è la sola bandiera che
      // serve, e senza di lei non si propone nulla.
      modifiche: nodo.dataset.modifiche
        ? (JSON.parse(nodo.dataset.modifiche) as Modifica[])
        : undefined,
```

3. uno stato nuovo, che ricorda l'ultimo lancio per cui c'è qualcosa da proporre:

```ts
const [daAccendere, setDaAccendere] = useState<string | null>(null);
```

4. dentro `lancia`, dopo `dichiara({...})`:

```ts
// Proposto, mai automatico: si lancia Benedizione su un compagno e
// l'effetto non è su Kaelen. Lanciare e accendere sono due gesti, e il
// secondo è una scelta.
setDaAccendere(b.modifiche === undefined ? null : b.slug);
```

5. nel `map` dei bersagli, dentro il portale, dopo il blocco del rituale:

```tsx
{
  daAccendere === b.slug && b.modifiche !== undefined && (
    <button type="button" class="tieni-acceso" onClick={() => tieniAcceso(b)}>
      Tienilo acceso
      {spentoDa(s, b) && <span class="tenue"> — spegne «{spentoDa(s, b)!.nome}»</span>}
    </button>
  );
}
```

6. e la funzione:

```ts
function tieniAcceso(b: Bersaglio) {
  muta((x) =>
    accendiEffetto(x, {
      id: nuovoIdEffetto(),
      nome: b.nome,
      // Lo slug: rilanciare rinnova la durata invece di accendere un secondo
      // Scudo della Fede.
      origine: b.slug,
      durata: b.durata ?? 'finché non finisce',
      concentrazione: b.concentrazione,
      promemoria: b.promemoria,
      modifiche: b.modifiche ?? [],
      accesoIl: new Date().toISOString(),
    }),
  );
  setDaAccendere(null);
}
```

- [ ] **Step 5: il CSS**

In coda a `src/styles/componenti.css`:

```css
/* La proposta sta dove è appena avvenuto il lancio, non in una striscia sua:
 * il gesto è lo stesso, e il pollice è già lì. */
.tieni-acceso {
  min-height: 44px;
  margin-top: var(--spazio-1);
  padding: 0 var(--spazio-2);
  border: 1px solid var(--ambra);
  border-radius: var(--raggio);
  background: transparent;
  color: var(--ambra);
  font-size: var(--fs-piccolo);
  cursor: pointer;
}
```

- [ ] **Step 6: lanciare i test e vederli passare**

Run: `npx vitest run src/islands/__tests__/ControlliLancio.test.ts`
Expected: PASS.

- [ ] **Step 7: il cancello e il commit**

```bash
npm run gate
git add src/islands/ControlliLancio.tsx src/components/CarteIncantesimo.astro src/islands/__tests__/ControlliLancio.test.ts src/styles/componenti.css
git commit -m "feat: offer to keep a cast spell running

Dopo il lancio, se l'incantesimo lascia qualcosa addosso, compare
«Tienilo acceso» lì dove il lancio è appena avvenuto. Proposto e mai
automatico: si lancia Benedizione su un compagno e l'effetto non è su
Kaelen.

Il bottone dice anche cosa spegnerà, prima che tu prema. L'origine è lo
slug, quindi rilanciare rinnova la durata invece di accendere un secondo
Scudo della Fede.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: i consumabili in scheda, e il modulo per aggiungerne

Una fiala di acqua santa è una cosa che spendi con la stessa grammatica di una carica di Incanalare Divinità: stesse carte, stesse caselle, nessun linguaggio visivo nuovo.

**Files:**

- Create: `src/components/Consumabili.astro`
- Create: `src/islands/parti/ModuloOggetto.tsx`
- Create: `src/islands/Consumabili.tsx`
- Test: `src/islands/__tests__/Consumabili.test.ts`
- Modify: `src/pages/scheda.astro`
- Modify: `src/styles/componenti.css`

**Interfaces:**

- Consumes: `consumabili`, `consuma`, `restituisci`, `aggiungiOggetto`, `VoceConsumabile` (Task 4); `caselle` da `@/lib/caselle`; `dichiara` da `@/lib/annulla`.
- Produces:
  - `ModuloOggetto` — `export default function ModuloOggetto(props: { onSalva: (dati: Omit<OggettoAggiunto, 'id'>) => void; onChiudi: () => void }): JSX.Element`
  - gli innesti `[data-cariche="<id>"]`, `[data-consuma="<id>"]`, `[data-consumabili-miei]`, `[data-modulo-oggetto]`

**Perché `parti/`.** `ModuloOggetto` serve a due sedi — la scheda e la Borsa — e un componente Preact copiato due volte è un componente che diverge. Non è un'isola: non lo monta Astro, lo importa chi ne ha bisogno. `src/islands/parti/` esiste per questo, e per ora ci sta lui solo.

**Le caselle fino a cinque, poi il numero.** Sette quadratini per le razioni sono un conto che nessuno legge a colpo d'occhio, e le razioni non si spendono in combattimento.

- [ ] **Step 1: scrivere il test che fallisce**

Crea `src/islands/__tests__/Consumabili.test.ts`. Il markup finto ricalca `Consumabili.astro`:

```ts
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Fragment, h, render } from 'preact';
import Consumabili from '@/islands/Consumabili';
import StrisciaAnnulla from '@/islands/StrisciaAnnulla';
import { annullabile } from '@/lib/annulla';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { muta, stato } from '@/lib/storage';

const pg = caricaPersonaggioDaFile();
let radice: HTMLDivElement;
const giro = () => new Promise((r) => setTimeout(r, 50));

const cariche = (id: string) => document.querySelector<HTMLElement>(`[data-cariche="${id}"]`)!;
const usa = (id: string) =>
  document.querySelector<HTMLButtonElement>(`[data-consuma="${id}"] button`);

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>` +
    `<div class="superficie consumabile-card"><div data-cariche="acqua-santa"></div>` +
    `<div class="spendi" data-consuma="acqua-santa"></div></div>` +
    `<div class="superficie consumabile-card"><div data-cariche="razioni"></div>` +
    `<div class="spendi" data-consuma="razioni"></div></div>` +
    `<div data-consumabili-miei></div>` +
    `<dialog id="aggiungi-oggetto"><div data-modulo-oggetto></div></dialog>`;
  const d = document.querySelector('dialog')!;
  Object.assign(d, {
    showModal: () => d.setAttribute('open', ''),
    close: () => d.removeAttribute('open'),
  });

  muta((x) => ({
    ...x,
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    oggettiAggiunti: [],
    indossati: [],
  }));
  annullabile.value = null;

  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Fragment, {}, h(Consumabili, {}), h(StrisciaAnnulla, {})), radice);
  await giro();
});

afterEach(() => render(null, radice));

describe('le cariche si leggono senza contare', () => {
  it('fino a cinque sono caselle', () => {
    expect(cariche('acqua-santa').querySelectorAll('.casella')).toHaveLength(1);
  });

  it('oltre le cinque è un numero', () => {
    // Sette quadratini per le razioni sono un conto che nessuno legge a colpo
    // d'occhio, e le razioni non si spendono in combattimento.
    expect(cariche('razioni').querySelectorAll('.casella')).toHaveLength(0);
    expect(cariche('razioni').textContent).toContain('7');
  });

  it('scendendo sotto le cinque tornano le caselle', async () => {
    muta((x) => ({ ...x, oggetti: { ...x.oggetti, razioni: 3 } }));
    await giro();
    expect(cariche('razioni').querySelectorAll('.casella')).toHaveLength(3);
  });
});

describe('spendere', () => {
  it('un tocco consuma', async () => {
    usa('acqua-santa')!.click();
    await giro();
    expect(stato.value.oggetti['acqua-santa']).toBe(0);
  });

  it('passa dalla striscia Annulla, come una carica', async () => {
    usa('razioni')!.click();
    await giro();
    expect(annullabile.value?.detto).toContain('Razioni');
    annullabile.value!.disfa();
    await giro();
    expect(stato.value.oggetti['razioni']).toBe(7);
  });

  it('a zero il comando non c’è', async () => {
    usa('acqua-santa')!.click();
    await giro();
    // Un bottone che non fa niente è peggio di un bottone assente: al tavolo
    // si preme e si crede di aver speso.
    expect(usa('acqua-santa')).toBeNull();
  });
});

describe('gli oggetti aggiunti a mano', () => {
  it('compaiono fra i consumabili, col filetto ambra', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        {
          id: 'mio:1',
          nome: 'Pozione di guarigione',
          quantita: 2,
          consumabile: true,
          modifiche: [],
        },
      ],
    }));
    await giro();

    const carta = document.querySelector('[data-consumabili-miei] .consumabile-card')!;
    expect(carta.textContent).toContain('Pozione di guarigione');
    expect(carta.classList.contains('mio')).toBe(true);
  });

  it('quelli non consumabili restano fuori dalla scheda', async () => {
    // La corda da cinquanta piedi non ha niente da fare qui.
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Cintura di Forza', quantita: 1, consumabile: false, modifiche: [] },
      ],
    }));
    await giro();
    expect(document.querySelector('[data-consumabili-miei]')!.textContent).not.toContain('Cintura');
  });

  it('si consumano come gli altri', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Pozione', quantita: 2, consumabile: true, modifiche: [] },
      ],
    }));
    await giro();
    usa('mio:1')!.click();
    await giro();
    expect(stato.value.oggettiAggiunti[0].quantita).toBe(1);
  });
});

describe('il modulo per aggiungerne', () => {
  const scrivi = (nome: string, valore: string) => {
    const campo = document.querySelector<HTMLInputElement>(
      `[data-modulo-oggetto] [name="${nome}"]`,
    )!;
    campo.value = valore;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('quattro campi visibili e i modificatori dietro una riga chiusa', () => {
    for (const nome of ['nome', 'quantita', 'consumabile', 'nota']) {
      expect(document.querySelector(`[data-modulo-oggetto] [name="${nome}"]`)).not.toBeNull();
    }
    const dettagli = document.querySelector<HTMLDetailsElement>('[data-modulo-oggetto] details')!;
    expect(dettagli.open).toBe(false);
    expect(dettagli.querySelector('summary')!.textContent).toContain('magico');
  });

  it('salva l’oggetto con un id suo', async () => {
    scrivi('nome', 'Pozione di guarigione');
    scrivi('quantita', '2');
    const consumabile = document.querySelector<HTMLInputElement>(
      '[data-modulo-oggetto] [name="consumabile"]',
    )!;
    consumabile.checked = true;
    consumabile.dispatchEvent(new Event('change', { bubbles: true }));

    document
      .querySelector<HTMLFormElement>('[data-modulo-oggetto] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();

    expect(stato.value.oggettiAggiunti).toHaveLength(1);
    expect(stato.value.oggettiAggiunti[0]).toMatchObject({
      id: 'mio:1',
      nome: 'Pozione di guarigione',
      quantita: 2,
      consumabile: true,
    });
  });

  it('senza nome non salva niente', async () => {
    document
      .querySelector<HTMLFormElement>('[data-modulo-oggetto] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();
    expect(stato.value.oggettiAggiunti).toEqual([]);
  });

  it('un oggetto magico porta la sua modifica', async () => {
    scrivi('nome', 'Scudo +1');
    scrivi('quantita', '1');
    const bersaglio = document.querySelector<HTMLSelectElement>(
      '[data-modulo-oggetto] [name="bersaglio"]',
    )!;
    bersaglio.value = 'ca';
    bersaglio.dispatchEvent(new Event('change', { bubbles: true }));
    scrivi('valore', '1');

    document
      .querySelector<HTMLFormElement>('[data-modulo-oggetto] form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await giro();

    expect(stato.value.oggettiAggiunti[0].modifiche).toEqual([
      { genere: 'voce', bersaglio: 'ca', valore: 1 },
    ]);
  });
});
```

- [ ] **Step 2: lanciarlo e vederlo fallire**

Run: `npx vitest run src/islands/__tests__/Consumabili.test.ts`
Expected: FAIL, «Failed to resolve import "@/islands/Consumabili"».

- [ ] **Step 3: il modulo condiviso**

Crea `src/islands/parti/ModuloOggetto.tsx`:

```tsx
import { useState } from 'preact/hooks';
import { caratteristicheModificabili, vociFinali, type Modifica } from '@/lib/modifiche';
import type { OggettoAggiunto } from '@/lib/oggetti';

/** Il modulo «aggiungi oggetto», usato da due sedi: la scheda e la Borsa. Non è
 *  un'isola — non lo monta Astro, lo importa chi ne ha bisogno — e sta in
 *  `parti/` per questo: un componente copiato due volte è un componente che
 *  diverge.
 *
 *  Quattro campi visibili: nome, quantità, consumabile, nota. Niente `nomeEn`,
 *  perché è roba inventata al tavolo e non una voce di manuale; niente peso e
 *  niente valore, che sono le colonne che si compilano due volte e poi non si
 *  guardano più.
 *
 *  I modificatori stanno dietro una riga chiusa, stesso mestiere del
 *  `<details class="correzioni">` nel pannello ⚡: il caso d'angolo si vede che
 *  lo è, e chi aggiunge una corda non si trova davanti un pannello da
 *  artefatto. */
export default function ModuloOggetto({
  onSalva,
  onChiudi,
}: {
  onSalva: (dati: Omit<OggettoAggiunto, 'id'>) => void;
  onChiudi: () => void;
}) {
  const [magico, setMagico] = useState(false);

  function salva(e: Event) {
    e.preventDefault();
    const modulo = e.currentTarget as HTMLFormElement;
    const dati = new FormData(modulo);
    const nome = String(dati.get('nome') ?? '').trim();
    if (!nome) return;

    const modifiche: Modifica[] = [];
    const bersaglio = String(dati.get('bersaglio') ?? '');
    const valore = Number(dati.get('valore') ?? 0);
    if (bersaglio && valore) {
      modifiche.push(
        (caratteristicheModificabili as readonly string[]).includes(bersaglio)
          ? { genere: 'punteggio', bersaglio: bersaglio as 'for', valore }
          : { genere: 'voce', bersaglio: bersaglio as 'ca', valore },
      );
    }

    onSalva({
      nome,
      quantita: Math.max(0, Number(dati.get('quantita') ?? 1) || 1),
      consumabile: dati.get('consumabile') === 'on',
      nota: String(dati.get('nota') ?? '').trim() || undefined,
      modifiche,
    });
    modulo.reset();
    setMagico(false);
    onChiudi();
  }

  return (
    <form class="modulo-oggetto" onSubmit={salva}>
      <label>
        Nome
        <input type="text" name="nome" required autocomplete="off" />
      </label>
      <label>
        Quantità
        <input type="number" name="quantita" min="0" value="1" />
      </label>
      <label class="riga">
        <input type="checkbox" name="consumabile" />
        Si consuma usandolo
      </label>
      <label>
        Nota
        <input type="text" name="nota" placeholder="dal forziere dei Vaerak" autocomplete="off" />
      </label>

      <details class="numeri" onToggle={(e) => setMagico(e.currentTarget.open)}>
        <summary>È un oggetto magico?</summary>
        <div class="riga">
          <select name="bersaglio" aria-label="Cosa modifica">
            <option value="">niente</option>
            {caratteristicheModificabili.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()} diventa
              </option>
            ))}
            {vociFinali.map((v) => (
              <option key={v} value={v}>
                {v} ±
              </option>
            ))}
          </select>
          <input type="number" name="valore" aria-label="Di quanto" value="0" />
        </div>
        {/* Il vincolo detto dove si sbaglia. `pg.armatura` porta già cotta di
            maglia e scudo: uno scudo +1 dichiarato come «CA 2» conterebbe due
            volte, e il totale sarebbe plausibile. */}
        {magico && (
          <p class="tenue avvertenza">
            Solo il di più: uno scudo +1 è «ca +1», non «ca +2». Quel che porti già è contato.
          </p>
        )}
      </details>

      <div class="comandi">
        <button type="button" onClick={onChiudi}>
          Annulla
        </button>
        <button type="submit">Aggiungi</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: il componente statico**

Crea `src/components/Consumabili.astro`:

```astro
---
import type { Personaggio } from '@/lib/schema';
import Superficie from '@/components/ui/Superficie.astro';
import NomeDoppio from '@/components/ui/NomeDoppio.astro';

/** Le carte dei consumabili che vengono dai dati. Il build le conosce, quindi
 *  le stampa lui: cariche e comando li disegna l'isola `Consumabili` per
 *  portale, come `CapacitaEReazioni` fa con `Contatori`. Qui c'è solo il posto
 *  dove andranno.
 *
 *  `consumabile` era una bandiera morta — lo schema la validava e nessuna
 *  interfaccia la leggeva. Questo è il primo posto che la usa. */
interface Props {
  pg: Personaggio;
}
const { pg } = Astro.props;
const consumabili = pg.equipaggiamento.filter((e) => e.consumabile);
---

<div class="consumabili">
  {
    consumabili.map((e) => (
      <Superficie class="consumabile-card">
        <h4 class="titolo">
          <NomeDoppio it={e.nome} en={e.nomeEn} />
        </h4>
        {e.note && <p class="tenue nota">{e.note}</p>}
        <div class="cariche" data-cariche={e.id} />
        <div class="spendi" data-consuma={e.id} />
      </Superficie>
    ))
  }
  {
    /* Gli oggetti raccolti al tavolo li disegna l'isola: il build non li può
      conoscere, e non c'è niente da stampare qui. */
  }
  <div data-consumabili-miei></div>
</div>

<button type="button" class="aggiungi-oggetto" data-apre="aggiungi-oggetto">
  + aggiungi oggetto
</button>

<dialog id="aggiungi-oggetto" aria-label="Aggiungi un oggetto">
  <div class="testa">
    <span class="kicker">Trovato al tavolo</span>
    <button type="button" class="chiudi" data-chiude aria-label="Chiudi">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"></path></svg>
    </button>
  </div>
  {/* Il modulo lo disegna l'isola, che è l'unica a saper scrivere nello stato. */}
  <div data-modulo-oggetto></div>
</dialog>
```

- [ ] **Step 5: l'isola**

Crea `src/islands/Consumabili.tsx`:

```tsx
import { createPortal } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { dichiara } from '@/lib/annulla';
import { caselle } from '@/lib/caselle';
import { aggiungiOggetto, consuma, consumabili, restituisci } from '@/lib/oggetti';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';
import ModuloOggetto from '@/islands/parti/ModuloOggetto';

/** Fino a quante cariche si disegnano a caselle. Oltre si scrive il numero:
 *  sette quadratini per le razioni sono un conto che nessuno legge a colpo
 *  d'occhio, e le razioni non si spendono in combattimento. */
const MAX_CASELLE = 5;

type Innesto = { nodo: HTMLElement; id: string };

/** Cariche e comandi dei consumabili, disegnati dentro le carte statiche per
 *  portale — stesso schema di `Contatori`. Gli oggetti raccolti al tavolo, che
 *  il build non può conoscere, l'isola li disegna per intero. */
export default function Consumabili() {
  // `client:only="preact"`: nessun pre-render lato server, come le altre isole.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const elenco = consumabili(pg, s);

  const [conta, setConta] = useState<Innesto[]>([]);
  const [comandi, setComandi] = useState<Innesto[]>([]);
  const [miei, setMiei] = useState<HTMLElement | null>(null);
  const [modulo, setModulo] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const trova = (attributo: string) =>
      [...document.querySelectorAll<HTMLElement>(`[${attributo}]`)].map((nodo) => ({
        nodo,
        id: nodo.getAttribute(attributo) ?? '',
      }));
    setConta(trova('data-cariche'));
    setComandi(trova('data-consuma'));
    setMiei(document.querySelector<HTMLElement>('[data-consumabili-miei]'));
    setModulo(document.querySelector<HTMLElement>('[data-modulo-oggetto]'));
  }, []);

  function spendi(voce: { id: string; nome: string }) {
    muta((x) => consuma(x, voce.id));
    // Stessa grammatica di una carica: un gesto solo, irreversibile, fatto col
    // pollice mentre qualcun altro parla. La striscia è quella di sempre.
    dichiara({
      detto: voce.nome,
      costo: 'Uno in meno',
      disfa: () => muta((x) => restituisci(x, voce.id)),
    });
  }

  const cariche = (quantita: number) =>
    quantita > MAX_CASELLE ? (
      <span class="valore">{quantita}</span>
    ) : (
      <span class="caselle" aria-label={`${quantita} rimasti`}>
        {caselle(0, quantita).map((_, i) => (
          <i key={i} class="casella piena" />
        ))}
      </span>
    );

  const comando = (voce: { id: string; nome: string; quantita: number }) =>
    voce.quantita === 0 ? (
      // Un bottone che non fa niente è peggio di un bottone assente: al tavolo
      // si preme e si crede di aver speso.
      <span class="tenue">Finito.</span>
    ) : (
      <button type="button" onClick={() => spendi(voce)}>
        Usa
      </button>
    );

  return (
    <>
      {conta.map((i) => {
        const voce = elenco.find((v) => v.id === i.id);
        return voce ? createPortal(cariche(voce.quantita), i.nodo) : null;
      })}

      {comandi.map((i) => {
        const voce = elenco.find((v) => v.id === i.id);
        return voce ? createPortal(comando(voce), i.nodo) : null;
      })}

      {miei &&
        createPortal(
          <>
            {elenco
              .filter((v) => v.mio)
              .map((v) => (
                // Il filetto ambra sul fianco, lo stesso segno che sulle carte
                // incantesimo distingue il dominio.
                <div key={v.id} class="superficie consumabile-card mio">
                  <h4 class="titolo">{v.nome}</h4>
                  {v.nota && <p class="tenue nota">{v.nota}</p>}
                  <div class="cariche" data-cariche={v.id}>
                    {cariche(v.quantita)}
                  </div>
                  <div class="spendi" data-consuma={v.id}>
                    {comando(v)}
                  </div>
                </div>
              ))}
          </>,
          miei,
        )}

      {modulo &&
        createPortal(
          <ModuloOggetto
            onSalva={(dati) => muta((x) => aggiungiOggetto(x, dati))}
            onChiudi={() => document.querySelector<HTMLDialogElement>('#aggiungi-oggetto')?.close()}
          />,
          modulo,
        )}
    </>
  );
}
```

Attenzione a un dettaglio che il test coglie: le carte disegnate dall'isola portano `data-cariche` e `data-consuma` **e** il loro contenuto già dentro. Non vengono ritrovate dal `querySelectorAll` iniziale — quello gira una volta sola al montaggio, prima che esistano — quindi non c'è doppio disegno. Gli attributi ci sono per il test e per coerenza con le carte del build.

- [ ] **Step 6: la sezione nella pagina**

In `src/pages/scheda.astro`, dentro la `<section>` di «Capacità e reazioni», dopo `<CapacitaEReazioni pg={pg} />`:

```astro
{
  /* Una fiala di acqua santa è una cosa che spendi con la stessa grammatica
        di una carica di Incanalare Divinità, e questa sezione si intitola già
        «cosa puoi spendere». Stesse carte, stesse caselle, nessun linguaggio
        visivo nuovo. */
}
<TestaSezione as="h3">Consumabili</TestaSezione>
<Consumabili pg={pg} />
```

e in fondo, accanto alle altre isole: `<ConsumabiliIsola client:only="preact" />`.

Gli import: `import Consumabili from '@/components/Consumabili.astro';` e `import ConsumabiliIsola from '@/islands/Consumabili';` — due nomi diversi perché sono due cose diverse, e chiamarle uguale renderebbe il file illeggibile.

- [ ] **Step 7: il CSS**

In coda a `src/styles/componenti.css`:

```css
.consumabili {
  display: grid;
  gap: var(--spazio-2);
}

.consumabile-card .titolo {
  margin: 0;
  font-size: var(--fs-h3);
}

.consumabile-card .nota {
  margin: 0.2rem 0 0;
  font-size: var(--fs-piccolo);
}

.consumabile-card .cariche {
  margin-top: var(--spazio-1);
}

.consumabile-card .cariche .valore {
  font-family: var(--font-mono);
  font-size: var(--fs-h3);
}

/* Il filetto ambra sul fianco: lo stesso segno che sulle carte incantesimo
 * distingue il dominio. Qui dice «questo l'hai raccolto tu». */
.consumabile-card.mio {
  border-left: 3px solid var(--ambra);
}

.aggiungi-oggetto {
  min-height: 44px;
  width: 100%;
  margin-top: var(--spazio-2);
  border: 1px dashed var(--filetto);
  border-radius: var(--raggio);
  background: transparent;
  color: var(--inchiostro-muto);
  font-size: var(--fs-piccolo);
  cursor: pointer;
}

dialog#aggiungi-oggetto {
  width: min(28rem, 100%);
  margin: auto;
  padding: var(--spazio-2) var(--spazio-2) calc(var(--spazio-2) + env(safe-area-inset-bottom, 0px));
  border: 1px solid var(--filetto);
  border-radius: var(--raggio-superficie);
  background: var(--carta);
  color: var(--inchiostro);
}

dialog#aggiungi-oggetto[open] {
  display: block;
}

dialog#aggiungi-oggetto::backdrop {
  background: rgb(0 0 0 / 0.6);
}

/* Il modulo divide lo stile con quello degli effetti: sono la stessa cosa —
 * qualche campo e due bottoni — e due fogli separati si scollerebbero. */
.modulo-oggetto label {
  display: grid;
  gap: 0.2rem;
  margin-bottom: var(--spazio-2);
  font-size: var(--fs-piccolo);
  color: var(--inchiostro-tenue);
}

.modulo-oggetto label.riga,
.modulo-oggetto .riga {
  display: flex;
  align-items: center;
  gap: var(--spazio-1);
}

.modulo-oggetto input,
.modulo-oggetto select {
  min-height: 44px;
  padding: 0 0.5rem;
  border: 1px solid var(--filetto);
  border-radius: var(--raggio);
  background: var(--superficie);
  color: var(--inchiostro);
  font: inherit;
}

.modulo-oggetto input[type='checkbox'] {
  min-height: 0;
  width: 22px;
  height: 22px;
}

.modulo-oggetto .numeri summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  font-size: var(--fs-piccolo);
  color: var(--inchiostro-muto);
  cursor: pointer;
}

.modulo-oggetto .avvertenza {
  margin: var(--spazio-1) 0 0;
  font-size: var(--fs-piccolo);
}

.modulo-oggetto .comandi {
  display: flex;
  justify-content: flex-end;
  gap: var(--spazio-1);
  margin-top: var(--spazio-2);
}

.modulo-oggetto .comandi button {
  min-height: 44px;
  padding: 0 var(--spazio-2);
  border: 1px solid var(--filetto);
  border-radius: var(--raggio);
  background: var(--superficie);
  color: var(--inchiostro);
  cursor: pointer;
}
```

- [ ] **Step 8: lanciare i test e vederli passare**

Run: `npm run build && npx vitest run src/islands/__tests__/Consumabili.test.ts src/styles/__tests__/altezze.test.ts`
Expected: PASS.

- [ ] **Step 9: il cancello e il commit**

```bash
npm run gate
git add src/components/Consumabili.astro src/islands/Consumabili.tsx src/islands/parti/ModuloOggetto.tsx src/islands/__tests__/Consumabili.test.ts src/pages/scheda.astro src/styles/componenti.css
git commit -m "feat: spend consumables where the spendable things live

Una fiala di acqua santa si spende con la stessa grammatica di una
carica di Incanalare Divinità, e la sezione si intitola già «cosa puoi
spendere»: stesse carte, stesse caselle, nessun linguaggio visivo nuovo.

Caselle fino a cinque, poi il numero — sette quadratini per le razioni
sono un conto che nessuno legge a colpo d'occhio. Consumare passa dalla
striscia Annulla. Gli oggetti raccolti al tavolo portano il filetto
ambra, come il dominio sulle carte incantesimo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: la Borsa a tre gruppi

Sedici voci tutte uguali, la corda e la cotta di maglia con lo stesso peso visivo. Tre gruppi al posto di un elenco piatto, e in cima il sommario di quel che porti addosso — che è il solo posto in cui un doppio conteggio si vede a occhio.

**Files:**

- Modify: `src/lib/schema.ts` (`gruppo` facoltativo sull'equipaggiamento)
- Modify: `src/content/character/kaelen.md` (quattro voci marcate `addosso`)
- Modify: `src/islands/Borsa.tsx`
- Modify: `src/pages/personaggio.astro`
- Modify: `src/styles/componenti.css`
- Test: `src/islands/__tests__/Borsa.test.ts` (nuovo)
- Test: `src/lib/__tests__/sheet-version.test.ts` (aggiunta in coda)

**Interfaces:**

- Consumes: `kaelenAdesso` (Task 5); `aggiungiOggetto`, `commutaIndossato`, `impostaQuantitaAggiunta`, `rimuoviOggetto` (Task 4); `ModuloOggetto` (Task 10).
- Produces: nessuna firma nuova.

**`gruppo` sta fuori da `campiVersione`.** Spostare la lampada da un gruppo all'altro non vale l'azzeramento di una sessione: è raggruppamento presentazionale, non un dato da cui lo stato dipende. C'è un test che lo dichiara.

- [ ] **Step 1: scrivere i test che falliscono**

Aggiungi in coda a `src/lib/__tests__/sheet-version.test.ts`:

```ts
it('il gruppo di un oggetto non azzera la sessione', () => {
  // Spostare la lampada dallo zaino alla cintura è presentazione, non un dato
  // da cui `StatoSessione` dipenda. `campiVersione` prende una proiezione
  // dell'equipaggiamento proprio per questo.
  const pg = caricaPersonaggioDaFile();
  const spostato = {
    ...pg,
    equipaggiamento: pg.equipaggiamento.map((e) =>
      e.id === 'lampada' ? { ...e, gruppo: 'addosso' as const } : e,
    ),
  };
  expect(hashDati(JSON.stringify(campiVersione(spostato, [])))).toBe(
    hashDati(JSON.stringify(campiVersione(pg, []))),
  );
});
```

Crea `src/islands/__tests__/Borsa.test.ts`:

```ts
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h, render } from 'preact';
import Borsa from '@/islands/Borsa';
import { caricaPersonaggioDaFile } from '@/lib/carica-personaggio';
import { muta, stato } from '@/lib/storage';
import { classeArmatura } from '@/lib/derive';

const pg = caricaPersonaggioDaFile();
let radice: HTMLDivElement;
const giro = () => new Promise((r) => setTimeout(r, 50));

const gruppo = (nome: string) => document.querySelector<HTMLElement>(`[data-gruppo="${nome}"]`)!;

beforeEach(async () => {
  localStorage.clear();
  document.body.innerHTML =
    `<script type="application/json" id="dati-iniziali">` +
    JSON.stringify({ pg, sheetVersion: 'v-test', pool: [] }) +
    `</script>`;
  muta((x) => ({
    ...x,
    oggetti: Object.fromEntries(pg.equipaggiamento.map((e) => [e.id, e.quantita])),
    oggettiAggiunti: [],
    indossati: [],
    effetti: [],
    esaurimento: 0,
  }));
  radice = document.createElement('div');
  document.body.append(radice);
  render(h(Borsa, {}), radice);
  await giro();
});

afterEach(() => render(null, radice));

describe('tre gruppi al posto di un elenco piatto', () => {
  it('addosso ci sono armatura, scudo, arma e focus', () => {
    const testo = gruppo('addosso').textContent!;
    for (const nome of ['Cotta di maglia', 'Scudo', 'Maglio da guerra', 'Simbolo sacro']) {
      expect(testo).toContain(nome);
    }
  });

  it('i consumabili stanno nel loro gruppo, non fra quelli addosso', () => {
    expect(gruppo('consumabili').textContent).toContain('Razioni');
    expect(gruppo('addosso').textContent).not.toContain('Razioni');
  });

  it('lo zaino è chiuso di default e raccoglie tutto il resto', () => {
    const zaino = document.querySelector<HTMLDetailsElement>('details[data-gruppo="zaino"]')!;
    expect(zaino.open).toBe(false);
    expect(zaino.textContent).toContain('Corda da 50 ft');
  });

  it('le monete stanno in fondo: si toccano a fine sessione, non durante', () => {
    const monete = document.querySelector('.monete')!;
    expect(
      gruppo('addosso').compareDocumentPosition(monete) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('il sommario di quel che porti addosso', () => {
  it('a mani nude dice la CA e basta', () => {
    expect(document.querySelector('.sommario-addosso')!.textContent).toContain(
      `CA ${classeArmatura(pg)}`,
    );
  });

  it('un oggetto indossato ci compare, ed è lì che un doppio conteggio si vede', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        {
          id: 'mio:1',
          nome: 'Cintura di Forza',
          quantita: 1,
          consumabile: false,
          modifiche: [{ genere: 'punteggio', bersaglio: 'for', valore: 20 }],
        },
      ],
      indossati: ['mio:1'],
    }));
    await giro();
    expect(document.querySelector('.sommario-addosso')!.textContent).toContain('FOR 20');
  });
});

describe('indossare e togliere', () => {
  it('un oggetto aggiunto si indossa da qui', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Scudo +1', quantita: 1, consumabile: false, modifiche: [] },
      ],
    }));
    await giro();
    document.querySelector<HTMLButtonElement>('[data-indossa="mio:1"]')!.click();
    await giro();
    expect(stato.value.indossati).toEqual(['mio:1']);
  });

  it('un oggetto del repo non si indossa: pg.armatura lo dice già', async () => {
    // Cotta di maglia e scudo stanno già in `pg.armatura`, e `classeArmatura`
    // li conta. Un interruttore qui li conterebbe due volte.
    expect(document.querySelector('[data-indossa="scudo"]')).toBeNull();
  });

  it('un oggetto aggiunto si può togliere di mezzo del tutto', async () => {
    muta((x) => ({
      ...x,
      oggettiAggiunti: [
        { id: 'mio:1', nome: 'Corda marcia', quantita: 1, consumabile: false, modifiche: [] },
      ],
    }));
    await giro();
    document.querySelector<HTMLButtonElement>('[data-rimuovi="mio:1"]')!.click();
    await giro();
    expect(stato.value.oggettiAggiunti).toEqual([]);
  });
});
```

- [ ] **Step 2: lanciarli e vederli fallire**

Run: `npx vitest run src/islands/__tests__/Borsa.test.ts src/lib/__tests__/sheet-version.test.ts`
Expected: FAIL — `[data-gruppo]` non esiste.

- [ ] **Step 3: il campo nello schema e nei dati**

In `src/lib/schema.ts`, dentro l'oggetto di `equipaggiamento`, dopo `consumabile`:

```ts
      /** Dove si disegna nella Borsa. Facoltativo, e volutamente **fuori** da
       *  `campiVersione`: spostare la lampada dallo zaino alla cintura è
       *  raggruppamento presentazionale, non un dato da cui lo stato dipende, e
       *  non vale l'azzeramento di una sessione. I consumabili non lo portano —
       *  il loro gruppo lo dice già `consumabile`. */
      gruppo: z.enum(['addosso', 'zaino']).optional(),
```

In `src/content/character/kaelen.md`, aggiungi `gruppo: addosso` a quattro voci: `cotta-di-maglia`, `scudo`, `maglio`, `simbolo-sacro`. Le altre restano senza, e senza vuol dire zaino.

- [ ] **Step 4: riscrivere l'isola**

Riscrivi `src/islands/Borsa.tsx` per intero:

```tsx
import { useRef } from 'preact/hooks';
import { kaelenAdesso } from '@/lib/adesso';
import { classeArmatura } from '@/lib/derive';
import { caratteristicheModificabili, type Modifica } from '@/lib/modifiche';
import {
  aggiungiOggetto,
  commutaIndossato,
  impostaQuantitaAggiunta,
  rimuoviOggetto,
} from '@/lib/oggetti';
import { impostaMonete, impostaOggetto } from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';
import ModuloOggetto from '@/islands/parti/ModuloOggetto';

const monete = [
  { chiave: 'mo', etichetta: 'mo', nomeEsteso: "Monete d'oro" },
  { chiave: 'ma', etichetta: 'ma', nomeEsteso: "Monete d'argento" },
  { chiave: 'mr', etichetta: 'mr', nomeEsteso: 'Monete di rame' },
] as const;

/** Le modifiche di un oggetto in una pillola sola: «CA +1», «FOR 20». Un
 *  punteggio si legge senza segno perché è assoluto — è il punteggio nuovo, non
 *  un di più — e una voce finale col segno perché è un addendo. La differenza
 *  fra le due cose si vede leggendo, che è il punto. */
function testoModifiche(modifiche: Modifica[]): string {
  return modifiche
    .map((m) =>
      m.genere === 'punteggio'
        ? `${m.bersaglio.toUpperCase()} ${m.valore}`
        : `${m.bersaglio.toUpperCase()} ${m.valore < 0 ? '−' : '+'}${Math.abs(m.valore)}`,
    )
    .join(' · ');
}

/** I due passi della quantità. Erano ripetuti riga per riga; adesso i gruppi
 *  sono tre e la ripetizione sarebbe stata tripla. */
function Passi({
  nome,
  quantita,
  cambia,
}: {
  nome: string;
  quantita: number;
  cambia: (n: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label={`Uno in meno di ${nome}`}
        onClick={() => cambia(quantita - 1)}
        disabled={quantita === 0}
      >
        −
      </button>
      <span class="valore">{quantita}</span>
      <button
        type="button"
        aria-label={`Uno in più di ${nome}`}
        onClick={() => cambia(quantita + 1)}
      >
        +
      </button>
    </>
  );
}

/** La Borsa, a tre gruppi.
 *
 *  Era un elenco piatto di sedici voci tutte uguali, con la corda da cinquanta
 *  piedi e la cotta di maglia allo stesso peso visivo. Il raggruppamento è
 *  presentazionale — `gruppo` sta fuori da `campiVersione` — perché spostare la
 *  lampada da un gruppo all'altro non vale l'azzeramento di una sessione. */
export default function Borsa() {
  // `client:only="preact"`: nessun pre-render lato server, quindi nessuna
  // guardia sul DOM da scrivere qui — vedi il rapporto del Task 8.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;
  const adesso = kaelenAdesso(pg, s);
  const dialogo = useRef<HTMLDialogElement>(null);

  const addosso = pg.equipaggiamento.filter((e) => e.gruppo === 'addosso');
  const nelloZaino = pg.equipaggiamento.filter((e) => e.gruppo !== 'addosso' && !e.consumabile);
  const consumabiliDaiDati = pg.equipaggiamento.filter((e) => e.consumabile);
  const miei = s.oggettiAggiunti ?? [];
  const indossati = new Set(s.indossati ?? []);

  // Il sommario esiste per una ragione sola: è il solo posto in cui un
  // modificatore dichiarato due volte si vede a occhio. Uno scudo +1 scritto
  // come «CA 2» darebbe qui un numero di uno più alto del vero, e sarebbe
  // comunque un numero plausibile — nessun test se ne accorgerebbe.
  const sommario = [
    `CA ${classeArmatura(adesso.pg) + adesso.voci.ca}`,
    ...caratteristicheModificabili
      .filter((c) => adesso.pg.caratteristiche[c] !== pg.caratteristiche[c])
      .map((c) => `${c.toUpperCase()} ${adesso.pg.caratteristiche[c]}`),
  ].join(' · ');

  /* Stesso markup di `NomeDoppio.astro`, scritto a mano perché un'isola Preact
     non può montare un componente `.astro`. Lo stile è condiviso, in
     `componenti.css`. */
  const nomeDoppio = (it: string, en: string, spento = false) => (
    <span class={`nome-doppio${spento ? ' tenue' : ''}`}>
      <span class="it">{it}</span>
      <span class="en">{en}</span>
    </span>
  );

  return (
    <div>
      <p class="sommario-addosso">Con quel che hai addosso: {sommario}</p>

      <div class="gruppo" data-gruppo="addosso">
        <span class="k">addosso e in pugno</span>
        <ul class="oggetti">
          {addosso.map((e) => (
            <li key={e.id}>
              <div class="info">
                {nomeDoppio(e.nome, e.nomeEn)}
                {e.note && <span class="tenue nota">{e.note}</span>}
              </div>
              {/* Niente interruttore «indossato» sulle voci del repo: cotta di
                  maglia e scudo stanno già in `pg.armatura`, e
                  `classeArmatura` li conta. Un interruttore qui li conterebbe
                  due volte. */}
              <span class="mod">già nella CA</span>
            </li>
          ))}
          {miei
            .filter((o) => !o.consumabile)
            .map((o) => (
              <li key={o.id} class="mio">
                <div class="info">
                  <span class="nome-doppio">
                    <span class="it">{o.nome}</span>
                    {o.nota && <span class="en">{o.nota}</span>}
                  </span>
                </div>
                {o.modifiche.length > 0 && <span class="mod">{testoModifiche(o.modifiche)}</span>}
                <button
                  type="button"
                  data-indossa={o.id}
                  aria-pressed={indossati.has(o.id)}
                  aria-label={indossati.has(o.id) ? `Togli ${o.nome}` : `Indossa ${o.nome}`}
                  onClick={() => muta((x) => commutaIndossato(x, o.id))}
                >
                  {indossati.has(o.id) ? 'addosso' : 'nello zaino'}
                </button>
                <button
                  type="button"
                  data-rimuovi={o.id}
                  aria-label={`Butta via ${o.nome}`}
                  onClick={() => muta((x) => rimuoviOggetto(x, o.id))}
                >
                  ×
                </button>
              </li>
            ))}
        </ul>
      </div>

      <div class="gruppo" data-gruppo="consumabili">
        <span class="k">consumabili · anche in scheda</span>
        <ul class="oggetti">
          {consumabiliDaiDati.map((e) => {
            const quantita = s.oggetti[e.id] ?? 0;
            return (
              <li key={e.id}>
                <div class="info">{nomeDoppio(e.nome, e.nomeEn, quantita === 0)}</div>
                <Passi
                  nome={e.nome}
                  quantita={quantita}
                  cambia={(n) => muta((x) => impostaOggetto(x, e.id, n))}
                />
              </li>
            );
          })}
          {miei
            .filter((o) => o.consumabile)
            .map((o) => (
              <li key={o.id} class="mio">
                <div class="info">
                  <span class="nome-doppio">
                    <span class="it">{o.nome}</span>
                    {o.nota && <span class="en">{o.nota}</span>}
                  </span>
                </div>
                <Passi
                  nome={o.nome}
                  quantita={o.quantita}
                  cambia={(n) => muta((x) => impostaQuantitaAggiunta(x, o.id, n))}
                />
                <button
                  type="button"
                  data-rimuovi={o.id}
                  aria-label={`Butta via ${o.nome}`}
                  onClick={() => muta((x) => rimuoviOggetto(x, o.id))}
                >
                  ×
                </button>
              </li>
            ))}
        </ul>
      </div>

      {/* Chiuso di default: undici voci che durante il gioco non si guardano
          mai, e che aperte spingevano fuori schermo tutto il resto. */}
      <details class="gruppo" data-gruppo="zaino">
        <summary>Nello zaino — {nelloZaino.length} voci</summary>
        <ul class="oggetti">
          {nelloZaino.map((e) => {
            const quantita = s.oggetti[e.id] ?? 0;
            return (
              <li key={e.id}>
                <div class="info">
                  {nomeDoppio(e.nome, e.nomeEn, quantita === 0)}
                  {e.note && <span class="tenue nota">{e.note}</span>}
                </div>
                <Passi
                  nome={e.nome}
                  quantita={quantita}
                  cambia={(n) => muta((x) => impostaOggetto(x, e.id, n))}
                />
              </li>
            );
          })}
        </ul>
      </details>

      <button type="button" class="aggiungi-oggetto" onClick={() => dialogo.current?.showModal()}>
        + aggiungi oggetto
      </button>

      {/* Qui il guscio lo rende l'isola, a differenza della scheda: su
          `/personaggio/` non ce n'è già uno da riusare, e scriverne uno in
          `personaggio.astro` per poi riempirlo per portale sarebbe un giro in
          più per lo stesso risultato. */}
      <dialog class="modulo-oggetto-guscio" ref={dialogo} aria-label="Aggiungi un oggetto">
        <ModuloOggetto
          onSalva={(dati) => muta((x) => aggiungiOggetto(x, dati))}
          onChiudi={() => dialogo.current?.close()}
        />
      </dialog>

      {/* In fondo: si toccano a fine sessione, non durante. */}
      <div class="monete">
        {monete.map((m) => (
          <label key={m.chiave}>
            <input
              type="number"
              min="0"
              aria-label={m.nomeEsteso}
              value={s.monete[m.chiave]}
              onInput={(e) =>
                muta((x) =>
                  impostaMonete(x, { ...x.monete, [m.chiave]: Number(e.currentTarget.value) }),
                )
              }
            />
            <span class="tenue">{m.etichetta}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: la pagina**

In `src/pages/personaggio.astro` non cambia nulla di sostanziale: la riga `.armatura-indossata` sopra la Borsa adesso è ridondante col gruppo «addosso» e va tolta, insieme al suo import di `NomeDoppio` se resta inutilizzato. La nota su lingue e strumenti resta dov'è.

- [ ] **Step 6: il CSS**

In coda a `src/styles/componenti.css`, con le regole per `dialog.modulo-oggetto-guscio` (le stesse di `dialog#aggiungi-oggetto` del Task 10: raggruppare i due selettori invece di ricopiarle), `.sommario-addosso` (fondo `--lampo-fondo`, filetto `--lampo`, testo `--lampo-cupo`, `border-radius: var(--raggio)`), `[data-gruppo]` (`.superficie`-simile, `margin-bottom: var(--spazio-1)`), `details[data-gruppo='zaino'] summary` (min-height 44px), `.oggetti .mod` (pillola `--lampo-fondo`), e i bottoni `[data-indossa]`/`[data-rimuovi]` a 44px. Le regole di `.oggetti` esistono già e non vanno riscritte.

- [ ] **Step 7: lanciare i test e vederli passare**

Run: `npm run build && npx vitest run src/islands/__tests__/Borsa.test.ts src/lib/__tests__/sheet-version.test.ts src/pages/__tests__/personaggio.test.ts`
Expected: PASS.

- [ ] **Step 8: il cancello e il commit**

```bash
npm run gate
git add src/lib/schema.ts src/content/character/kaelen.md src/islands/Borsa.tsx src/islands/__tests__/Borsa.test.ts src/pages/personaggio.astro src/styles/componenti.css src/lib/__tests__/sheet-version.test.ts
git commit -m "feat: group the bag by what you are actually holding

Sedici voci tutte uguali diventano tre gruppi: addosso, consumabili,
zaino chiuso. In cima il sommario di quel che porti — che è il solo
posto in cui un modificatore dichiarato due volte si vede a occhio.

Il campo gruppo sta fuori da campiVersione: spostare la lampada da un
gruppo all'altro è presentazione, e non vale l'azzeramento di una
sessione. C'è un test che lo dichiara.

Le monete scendono in fondo: si toccano a fine sessione, non durante.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Cosa resta all'occhio umano

Nessun test copre queste, e vanno provate al telefono vero insieme a quelle già in sospeso sul ramo `fix/segnalazioni-mobile`:

- la striscia con tre effetti addosso a 390 di larghezza: scorre in orizzontale o va a capo, e quale delle due è meno peggio col pollice;
- la fascia delle difese con la CA modificata: se il valore barrato accanto si legge o è solo sporco;
- il modulo «aggiungi oggetto» mentre il DM sta ancora descrivendo il forziere, che è la sola prova che conta per capire se ha un campo di troppo;
- una sessione vera col chip della concentrazione, per sapere se il secondo incantesimo che spegne il primo è un sollievo o una sorpresa sgradita;
- il chip a 44px: lo sketch ne proponeva 28, e il piano l'ha alzato per il dito. A occhio potrebbe risultare una riga troppo grassa in cima alla scheda.

## Cosa questo piano non fa, e perché

- **Niente contatore di round.** Richiederebbe un bottone a ogni round, e la prima volta che ci si dimentica mente con l'aria di dire il vero.
- **Prove, TS e tiri per colpire non vengono riscritti sulle carte.** Stanno su una ventina di superfici diverse; al loro posto c'è la riga di `riassuntoVoci`. È il solo scostamento visibile dalla spec, ed è dichiarato nel Task 8.
- **Niente PF massimi modificati**, quindi niente Aiuto: altro campo, altre regole di recupero, altro giro.
- **Niente peso e niente ingombro.**
- **Niente modificatori sugli oggetti del repo:** Kaelen non possiede niente di magico, e lo schema resta com'è finché non è vero il contrario.
- **Nessuna migrazione D1 nuova:** lo stato è un blob JSON in una colonna sola, e i campi nuovi viaggiano da soli.
