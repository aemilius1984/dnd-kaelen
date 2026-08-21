-- Le sessioni salvate in nuvola. Una riga per salvataggio, e lo stato intero
-- dentro `stato` come JSON: `StatoSessione` è già piatto, serializzabile e
-- versionato, e `carica()` sa già migrare da una versione all'altra. Spezzarlo
-- in colonne significherebbe tenere due schemi allineati a mano.
--
-- Nessuna colonna per il dispositivo: nessuna API di browser lo dà in modo
-- affidabile, indovinarlo dallo user agent dà «iPhone» anche all'iPad, e non
-- interessa saperlo.
CREATE TABLE IF NOT EXISTS sessioni (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  creato_il TEXT NOT NULL,     -- ISO
  etichetta TEXT,              -- «il molo di Thuunvar»
  nota      TEXT,              -- copia di stato.note al momento del salvataggio
  schema_v  INTEGER NOT NULL,  -- SCHEMA_VERSION
  sheet_v   TEXT NOT NULL,     -- sheetVersion
  stato     TEXT NOT NULL      -- StatoSessione, JSON
);

-- L'elenco si legge sempre dal più recente, e la potatura cerca la ventesima
-- riga in quello stesso ordine.
CREATE INDEX IF NOT EXISTS sessioni_per_data ON sessioni (creato_il DESC);
