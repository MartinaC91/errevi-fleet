import type { ChangeEvent } from "react";

type Props = {
  fileName: string;
  caricamento: boolean;
  errore: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function UploadExcel({
  fileName,
  caricamento,
  errore,
  onChange,
}: Props) {
  return (
    <section style={stili.area}>
      <div style={stili.icona}>📊</div>
      <p style={stili.testo}>Seleziona il file Excel dei controlli mezzi</p>
      <label style={stili.pulsante}>
        Seleziona file
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onChange}
          style={{ display: "none" }}
        />
      </label>
      {fileName && (
        <p style={stili.nomeFile}>
          File selezionato: <strong>{fileName}</strong>
        </p>
      )}
      {caricamento && <p>Analisi del file in corso...</p>}
      {errore && <p style={stili.errore}>{errore}</p>}
    </section>
  );
}

const stili: Record<string, React.CSSProperties> = {
  area: {
    padding: 36,
    border: "2px dashed #c8c8c8",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    textAlign: "center",
  },
  icona: { fontSize: 42 },
  testo: { marginBottom: 22, fontSize: 17, fontWeight: 600 },
  pulsante: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: 8,
    backgroundColor: "#e6007e",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  nomeFile: { marginTop: 18 },
  errore: { marginTop: 16, color: "#b00020", fontWeight: 700 },
};
