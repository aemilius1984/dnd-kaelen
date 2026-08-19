/** Il passaggio di consegne fra il Riposo Lungo e l'archivio.
 *
 *  Il riposo avviene sulla Scheda, ma i sei preparati si scelgono su
 *  `/preparati/`: fra i due c'è una navigazione, e la bozza è un signal di
 *  modulo che una navigazione azzera. Serve quindi qualcosa che sopravviva al
 *  cambio di pagina e nient'altro — non un dato del personaggio, che è quel
 *  che *sceglie*, non il fatto che stia scegliendo adesso.
 *
 *  `sessionStorage` regge esattamente questo: la scheda, non la vita del
 *  personaggio. Muore con la scheda del browser, ed è giusto — riaprendo il
 *  sito domani non si è più a metà di un riposo. Il limite è che chiudendo la
 *  scheda a metà passaggio l'obbligo si perde: resta la strada «Modifica
 *  concessa dal DM». Vedi BACKLOG.md. */
const CHIAVE = 'kaelen:preparazione-dovuta';

export function segnalaPreparazioneDovuta(deposito: Storage): void {
  deposito.setItem(CHIAVE, '1');
}

/** Vera una volta sola: chiedere se il riposo è appena finito lo consuma, così
 *  ricaricando la pagina non si riapre una sessione già aperta e chiusa. */
export function raccogliPreparazioneDovuta(deposito: Storage): boolean {
  const dovuta = deposito.getItem(CHIAVE) !== null;
  deposito.removeItem(CHIAVE);
  return dovuta;
}

/** L'unica sede dell'elenco. Sta qui perché la nominano in due — il pannello
 *  che ci porta e il menu che ci linka — e una stringa scritta due volte è una
 *  stringa che prima o poi diverge. */
export const PERCORSO_ARCHIVIO = '/preparati/';

/** La navigazione, dietro un oggetto invece che chiamata diretta.
 *
 *  Non è astrazione per gusto: `location.assign` non si può sostituire sotto
 *  jsdom — la proprietà non è riconfigurabile — quindi una chiamata diretta
 *  renderebbe il passaggio all'archivio impossibile da provare, e quel
 *  passaggio è esattamente il punto in cui il Riposo Lungo consegna il lavoro
 *  a un'altra pagina. */
export const navigazione = {
  vai: (percorso: string): void => {
    location.assign(percorso);
  },
};
