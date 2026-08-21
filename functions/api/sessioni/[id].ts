import { elimina, errore, senzaNuvola, una } from '../_nuvola';

interface Env {
  DB?: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  if (!env.DB) return senzaNuvola();
  const id = Number(params.id);
  if (!Number.isInteger(id)) return errore(400, 'Id non valido.');

  try {
    const riga = await una(env.DB, id);
    // 404 e non un 200 vuoto: chi riprende deve sapere che quella sessione non
    // c'è più, non ritrovarsi una scheda azzerata senza spiegazione.
    if (riga === null) return errore(404, 'Sessione non trovata.');
    return Response.json(riga);
  } catch {
    return errore(502, 'La nuvola non ha risposto.');
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  if (!env.DB) return senzaNuvola();
  const id = Number(params.id);
  if (!Number.isInteger(id)) return errore(400, 'Id non valido.');

  try {
    await elimina(env.DB, id);
    return new Response(null, { status: 204 });
  } catch {
    return errore(502, 'La nuvola non ha risposto.');
  }
};
