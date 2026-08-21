import { useRef } from 'preact/hooks';
import { kaelenAdesso } from '@/lib/adesso';
import { classeArmatura } from '@/lib/derive';
import { caratteristicheModificabili, type Modifica } from '@/lib/modifiche';
import {
  aggiungiOggettoIndossandolo,
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
          onSalva={(dati) => muta((x) => aggiungiOggettoIndossandolo(x, dati))}
          caratteristiche={adesso.pg.caratteristiche}
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
