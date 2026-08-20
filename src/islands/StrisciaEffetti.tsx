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
import { commutaIndossato } from '@/lib/oggetti';
import { attaccoIncantesimi, cdIncantesimi, classeArmatura, iniziativa, segno } from '@/lib/derive';
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
        {/* Gli oggetti indossati stanno nella stessa striscia degli effetti,
            perché sono la stessa domanda: perché quel numero non è quello
            stampato. Il chip li distingue senza una parola — nessun cerchio di
            concentrazione, e la × sfila l'oggetto invece di buttarlo via. */}
        {(s.oggettiAggiunti ?? [])
          .filter((o) => (s.indossati ?? []).includes(o.id) && o.modifiche.length > 0)
          .map((o) => (
            <span key={o.id} class="chip-effetto oggetto">
              {/* Un quadrato dove la concentrazione ha un cerchio: due forme si
                  distinguono senza leggere una parola. */}
              <i class="segno" aria-hidden="true" />
              <span class="nome">{o.nome}</span>
              <span class="durata tenue">addosso</span>
              <button
                type="button"
                class="spegni"
                data-sfila={o.id}
                aria-label={`Togli ${o.nome}`}
                onClick={() => muta((x) => commutaIndossato(x, o.id))}
              >
                ×
              </button>
            </span>
          ))}

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
