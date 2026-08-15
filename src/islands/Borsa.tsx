import { impostaMonete, impostaOggetto } from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

const monete = [
  { chiave: 'mo', etichetta: 'mo', nomeEsteso: "Monete d'oro" },
  { chiave: 'ma', etichetta: 'ma', nomeEsteso: "Monete d'argento" },
  { chiave: 'mr', etichetta: 'mr', nomeEsteso: 'Monete di rame' },
] as const;

export default function Borsa() {
  // `client:only="preact"`: nessun pre-render lato server, quindi nessuna
  // guardia sul DOM da scrivere qui — vedi il rapporto del Task 8.
  assicuraInizializzato();
  const { pg } = datiIniziali();
  const s = stato.value;

  return (
    <div>
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

      <ul class="oggetti">
        {pg.equipaggiamento.map((e) => {
          const quantita = s.oggetti[e.id] ?? 0;
          return (
            <li key={e.id}>
              <span class={quantita === 0 ? 'tenue' : undefined}>{e.nome}</span>
              <button
                type="button"
                aria-label={`Uno in meno di ${e.nome}`}
                onClick={() => muta((x) => impostaOggetto(x, e.id, quantita - 1))}
                disabled={quantita === 0}
              >
                −
              </button>
              <span class="valore">{quantita}</span>
              <button
                type="button"
                aria-label={`Uno in più di ${e.nome}`}
                onClick={() => muta((x) => impostaOggetto(x, e.id, quantita + 1))}
              >
                +
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
