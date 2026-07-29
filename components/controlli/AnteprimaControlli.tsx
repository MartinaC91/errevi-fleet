import type { Controllo } from "../../lib/controlli/parserExcel";
import { contieneProblema } from "../../lib/controlli/utils";

export default function AnteprimaControlli({ controlli }: { controlli: Controllo[] }) {
  return (
    <section style={stili.sezione}>
      <h2 style={{ marginTop: 0 }}>Anteprima controlli</h2>
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table style={stili.tabella}>
          <thead>
            <tr>
              {[
                "N. chiave",
                "Targa",
                "Data controllo",
                "Operatore",
                "Km",
                "Spie",
                "Pneumatici",
                "Problema",
              ].map((titolo) => (
                <th key={titolo} style={stili.th}>{titolo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {controlli.map((controllo) => {
              const anomalia = contieneProblema(controllo.anomalie);
              const bloccante = contieneProblema(controllo.problemaBloccante);
              return (
                <tr key={controllo.id}>
                  <td style={stili.td}><strong>{controllo.numeroChiave || "—"}</strong></td>
                  <td style={stili.td}>{controllo.targa || "—"}</td>
                  <td style={stili.td}>{controllo.dataControllo || "—"}</td>
                  <td style={stili.td}>{controllo.operatore || "—"}</td>
                  <td style={stili.td}>{controllo.km || "—"}</td>
                  <td style={stili.td}>{controllo.spie || "—"}</td>
                  <td style={stili.td}>{controllo.pneumatici || "—"}</td>
                  <td style={stili.td}>
                    <span style={bloccante ? stili.rosso : anomalia ? stili.arancione : stili.verde}>
                      {bloccante ? "Bloccante" : anomalia ? "Anomalia" : "Regolare"}
                    </span>
                    {anomalia && <div style={stili.dettaglio}>{controllo.anomalie}</div>}
                    {bloccante && <div style={stili.dettaglio}>{controllo.problemaBloccante}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const stili: Record<string, React.CSSProperties> = {
  sezione: { marginTop: 28, padding: 24, borderRadius: 12, backgroundColor: "#fff" },
  tabella: { width: "100%", borderCollapse: "collapse", minWidth: 1050 },
  th: { padding: 12, backgroundColor: "#3c3c3b", color: "#fff", textAlign: "left", whiteSpace: "nowrap" },
  td: { padding: 12, borderBottom: "1px solid #e5e5e5", verticalAlign: "top" },
  rosso: { ...badge, backgroundColor: "#ffd7d7", color: "#a60000" },
  arancione: { ...badge, backgroundColor: "#ffe4bd", color: "#8a4b00" },
  verde: { ...badge, backgroundColor: "#d9f5df", color: "#116b2d" },
  dettaglio: { maxWidth: 280, marginTop: 7, fontSize: 12, lineHeight: 1.4 },
};
