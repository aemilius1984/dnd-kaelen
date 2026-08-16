import { useEffect, useState } from 'preact/hooks';
import { CHIAVE_TEMA, risolviTema, type Tema } from '@/lib/tema';
import { azzeraSessione } from '@/lib/storage';

/** Due soli controlli, entrambi impossibili in CSS: leggere e scrivere una
 *  preferenza persistente, e cancellare lo stato di sessione. Il resto del
 *  menu è markup statico in Menu.astro. */
export default function AzioniMenu() {
  const [tema, setTema] = useState<Tema>('tempesta');

  useEffect(() => {
    let salvato: string | null;
    try {
      salvato = localStorage.getItem(CHIAVE_TEMA);
    } catch {
      salvato = null;
    }
    setTema(risolviTema(salvato, window.matchMedia('(prefers-color-scheme: light)').matches));
  }, []);

  function cambia() {
    const prossimo: Tema = tema === 'tempesta' ? 'pergamena' : 'tempesta';
    setTema(prossimo);
    document.documentElement.dataset.tema = prossimo;
    try {
      localStorage.setItem(CHIAVE_TEMA, prossimo);
    } catch {
      // storage negato: il tema vale per questa sola pagina
    }
  }

  return (
    <div class="azioni-menu">
      <button type="button" onClick={cambia}>
        Tema: {tema === 'tempesta' ? 'Tempesta' : 'Pergamena'}
      </button>
      <button
        type="button"
        class="pericoloso"
        onClick={() => {
          if (confirm('Azzerare tutta la sessione, note e monete comprese?')) azzeraSessione();
        }}
      >
        Azzera sessione
      </button>
    </div>
  );
}
