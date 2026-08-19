import { LIMITE_SESSIONI, elenca, errore, inserisci, leggiCorpo, senzaNuvola } from './_nuvola';

interface Env {
  DB?: D1Database;
}

/** L'elenco delle sessioni salvate, dalla più recente.
 *
 *  Senza `stato`: venti stati interi per disegnare venti righe di riepilogo
 *  sarebbero mezzo megabyte per una schermata che ne mostra cinque campi. Lo
 *  stato lo si chiede quando si riprende, una riga alla volta. */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return senzaNuvola();
  try {
    return Response.json(await elenca(env.DB));
  } catch {
    return errore(502, 'La nuvola non ha risposto.');
  }
};

/** Salva la sessione corrente e pota le più vecchie.
 *
 *  Il client manda `stato.value` così com'è: è già piatto, serializzabile e
 *  versionato, e al ripristino `carica()` sa migrarlo. L'unica cosa digitata
 *  al momento è l'etichetta, che è un titolo; la nota viaggia dentro lo stato
 *  e la riga ne conserva una copia. */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return senzaNuvola();

  const corpo = await leggiCorpo(request);
  if (corpo === null) return errore(400, 'Corpo non valido: serve { etichetta?, stato }.');

  try {
    const id = await inserisci(env.DB, corpo, LIMITE_SESSIONI);
    return Response.json({ id }, { status: 201 });
  } catch {
    // Non si finge di aver salvato: chi crede di avere una copia in nuvola e
    // non ce l'ha lo scopre la sera in cui gli serve.
    return errore(502, 'La nuvola non ha risposto: niente è stato salvato.');
  }
};
