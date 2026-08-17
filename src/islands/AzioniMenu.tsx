import { azzeraSessione } from '@/lib/storage';

/** Un solo controllo, e impossibile in CSS: cancellare lo stato di sessione.
 *  Il commutatore di tema viveva qui finché i temi erano due; adesso il tema è
 *  uno e scritto in build da BaseLayout. Vedi BACKLOG.md. */
export default function AzioniMenu() {
  return (
    <div class="azioni-menu">
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
