import { credenzialiValide, rispostaNonAutorizzato } from '../src/lib/basic-auth';

interface Env {
  SITE_USER?: string;
  SITE_PASS?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { SITE_USER, SITE_PASS } = context.env;

  // fail-closed: senza segreti il sito non si apre
  if (!SITE_USER || !SITE_PASS) {
    return rispostaNonAutorizzato('Autenticazione non configurata su questo deploy.');
  }

  if (!credenzialiValide(context.request.headers.get('Authorization'), SITE_USER, SITE_PASS)) {
    return rispostaNonAutorizzato();
  }

  return context.next();
};
