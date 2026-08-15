/** Confronto a tempo costante: non rivela la lunghezza del prefisso corretto. */
function confrontoCostante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const SCHEMA = 'basic ';

export function credenzialiValide(
  header: string | null,
  utente: string,
  password: string,
): boolean {
  // credenziali configurate vuote non sono mai valide, a prescindere dall'header:
  // impedisce che un segreto salvato vuoto apra il sito a chiunque.
  if (!utente || !password) return false;
  // RFC 9110: lo schema di autenticazione non distingue maiuscole/minuscole.
  if (!header || header.slice(0, SCHEMA.length).toLowerCase() !== SCHEMA) return false;
  let decodificato: string;
  try {
    const binario = atob(header.slice(SCHEMA.length).trim());
    // RFC 7617 (charset=UTF-8): i byte decodificati vanno interpretati come UTF-8,
    // non come Latin-1, altrimenti una password accentata non corrisponde mai.
    decodificato = new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
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
      // public/_headers è applicato dal server degli asset statici, non a una
      // Response costruita da una Function: questi header vanno ripetuti qui.
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
