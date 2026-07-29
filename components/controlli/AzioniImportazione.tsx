import type { RisultatoCreazioneMezzi } from "../../lib/controlli/creaMezzi";
import type { RisultatoImportazione } from "../../lib/controlli/importaControlli";

type Props = {
  occupato: boolean;
  messaggio: string;
  risultatoMezzi: RisultatoCreazioneMezzi | null;
  risultatoImportazione: RisultatoImportazione | null;
  onCreaMezzi: () => void;
  onImporta: () => void;
};

export default function AzioniImportazione({
  occupato,
  messaggio,
  risultatoMezzi,
  risultatoImportazione,
  onCreaMezzi,
  onImporta,
}: Props) {
  return (
    <>
      <section style={stili.area}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Importazione nel gestionale</h2>
          <p style={{ margin: "7px 0 0", color: "#666" }}>
            Prima crea i mezzi mancanti, poi importa i controlli.
          </p>
        </div>
        <div style={stili.pulsanti}>
          <button type="button" onClick={onCreaMezzi} disabled={occupato} style={stili.secondario}>
            ➕ Crea mezzi mancanti
          </button>
          <button type="button" onClick={onImporta} disabled={occupato} style={stili.primario}>
            {occupato ? "Operazione in corso..." : "Importa in Supabase"}
          </button>
        </div>
      </section>

      {messaggio && (
        <section style={stili.esito}>
          <strong>{messaggio}</strong>
          {risultatoMezzi && (
            <div style={stili.rigaEsito}>
              <span>🚗 Nel file: {risultatoMezzi.trovatiNelFile}</span>
              <span>✅ Creati: {risultatoMezzi.creati}</span>
              <span>↩️ Già presenti: {risultatoMezzi.giaPresenti}</span>
              <span>⚠️ Errori: {risultatoMezzi.errori}</span>
            </div>
          )}
          {risultatoImportazione && (
            <div style={stili.rigaEsito}>
              <span>✅ Importati: {risultatoImportazione.importati}</span>
              <span>↩️ Già presenti: {risultatoImportazione.duplicati}</span>
              <span>🚗 Mezzi non trovati: {risultatoImportazione.mezziNonTrovati}</span>
              <span>⚠️ Errori: {risultatoImportazione.errori}</span>
            </div>
          )}
        </section>
      )}
    </>
  );
}

const bottone: React.CSSProperties = {
  padding: "13px 20px",
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

const stili: Record<string, React.CSSProperties> = {
  area: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    flexWrap: "wrap",
    marginTop: 24,
    padding: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  },
  pulsanti: { display: "flex", gap: 12, flexWrap: "wrap" },
  primario: { ...bottone, border: "none", backgroundColor: "#e6007e", color: "#fff" },
  secondario: { ...bottone, border: "1px solid #e6007e", backgroundColor: "#fff", color: "#e6007e" },
  esito: { marginTop: 18, padding: 20, border: "1px solid #b9dfc2", borderRadius: 10, backgroundColor: "#eef9f0" },
  rigaEsito: { display: "flex", flexWrap: "wrap", gap: 18, marginTop: 12 },
};
