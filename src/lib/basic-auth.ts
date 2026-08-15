/** Confronto a tempo costante: non rivela la lunghezza del prefisso corretto. */
function confrontoCostante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function credenzialiValide(
  header: string | null,
  utente: string,
  password: string,
): boolean {
  if (!header?.startsWith('Basic ')) return false;
  let decodificato: string;
  try {
    decodificato = atob(header.slice('Basic '.length).trim());
  } catch {
    return false;
  }
  const separatore = decodificato.indexOf(':');
  if (separatore < 0) return false;
  const u = decodificato.slice(0, separatore);
  const p = decodificato.slice(separatore + 1);
  // entrambi i confronti vengono sempre eseguiti
  const okUtente = confrontoCostante(u, utente);
  const okPassword = confrontoCostante(p, password);
  return okUtente && okPassword;
}

export function rispostaNonAutorizzato(messaggio = 'Autenticazione richiesta.'): Response {
  return new Response(messaggio, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Kaelen", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
