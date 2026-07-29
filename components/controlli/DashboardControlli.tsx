import type { Controllo } from "../../lib/controlli/parserExcel";
import { contieneProblema } from "../../lib/controlli/utils";

export default function DashboardControlli({ controlli }: { controlli: Controllo[] }) {
  const mezziUnici = new Set(
    controlli.map((controllo) => controllo.numeroChiave || controllo.targa)
  ).size;
  const anomalie = controlli.filter((c) => contieneProblema(c.anomalie)).length;
  const bloccanti = controlli.filter((c) =>
    contieneProblema(c.problemaBloccante)
  ).length;

  return (
    <section style={stili.griglia}>
      <Card numero={controlli.length} etichetta="Verifiche" />
      <Card numero={mezziUnici} etichetta="Mezzi" />
      <Card numero={anomalie} etichetta="Anomalie" />
      <Card numero={bloccanti} etichetta="Problemi bloccanti" />
    </section>
  );
}

function Card({ numero, etichetta }: { numero: number; etichetta: string }) {
  return (
    <div style={stili.card}>
      <span style={stili.numero}>{numero}</span>
      <span style={stili.etichetta}>{etichetta}</span>
    </div>
  );
}

const stili: Record<string, React.CSSProperties> = {
  griglia: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginTop: 24,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    padding: 22,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  },
  numero: { fontSize: 30, fontWeight: 800, color: "#e6007e" },
  etichetta: { marginTop: 5, color: "#666666" },
};
