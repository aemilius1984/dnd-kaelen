import { togglePreparato } from '@/lib/sheet-state';
import { assicuraInizializzato, datiIniziali, muta, stato } from '@/lib/storage';

export default function PreparatiPicker() {
  // `client:idle` pre-renderizza comunque in build (Node, senza DOM): stesso
  // guardiano SSR di PfTracker.tsx e Risorse.tsx.
  if (typeof document === 'undefined') return null;

  assicuraInizializzato();
  const { pg, pool } = datiIniziali();
  const s = stato.value;
  const pieno = s.preparati.length >= pg.limitePreparati;

  return (
    <div>
      <p class="tenue">
        Preparati {s.preparati.length}/{pg.limitePreparati}. I quattro incantesimi del dominio sono
        sempre preparati e non contano.
      </p>
      <ul class="pool">
        {pool.map((m) => {
          const scelto = s.preparati.includes(m.slug);
          return (
            <li key={m.slug}>
              <label class={scelto ? 'scelto' : undefined}>
                <input
                  type="checkbox"
                  checked={scelto}
                  disabled={!scelto && pieno}
                  onChange={() => muta((x) => togglePreparato(x, pg, m.slug))}
                />
                <span>{m.nome}</span>
                <span class="tenue">liv. {m.livello}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
