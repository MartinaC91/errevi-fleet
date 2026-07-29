"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";

type RigaExcel = Record<string, unknown>;

type Controllo = {
  id: string;
  numeroChiave: string;
  targa: string;
  dataControllo: string;
  operatore: string;
  km: string;
  spie: string;
  pneumatici: string;
  anomalie: string;
  problemaBloccante: string;
};

function testo(valore: unknown): string {
  if (valore === null || valore === undefined) return "";
  return String(valore).trim();
}

function extractVehicleInfo(titolo: string) {
  const titoloPulito = titolo.trim();

  const risultato = titoloPulito.match(
    /VERIFICA\s+MEZZO\s*-\s*([^-]+?)\s*-\s*(.+)$/i
  );

  if (!risultato) {
    return {
      numeroChiave: "",
      targa: "",
    };
  }

  return {
    numeroChiave: risultato[1].trim(),
    targa: risultato[2].replace(/\s+/g, "").toUpperCase(),
  };
}

function contieneProblema(valore: string): boolean {
  const valorePulito = valore.trim().toLowerCase();

  if (!valorePulito) return false;

  const valoriNegativi = [
    "no",
    "nessuno",
    "nessuna",
    "nessun problema",
    "non presente",
    "n/a",
    "ok",
  ];

  return !valoriNegativi.includes(valorePulito);
}

function formattaData(valore: unknown): string {
  if (!valore) return "";

  if (valore instanceof Date && !Number.isNaN(valore.getTime())) {
    return valore.toLocaleDateString("it-IT");
  }

  if (typeof valore === "number") {
    const dataExcel = XLSX.SSF.parse_date_code(valore);

    if (dataExcel) {
      return new Date(
        dataExcel.y,
        dataExcel.m - 1,
        dataExcel.d
      ).toLocaleDateString("it-IT");
    }
  }

  return testo(valore);
}

export default function ControlliPage() {
  const [fileName, setFileName] = useState("");
  const [controlli, setControlli] = useState<Controllo[]>([]);
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setControlli([]);
    setErrore("");
    setCaricamento(true);

    try {
      const contenuto = await file.arrayBuffer();

      const workbook = XLSX.read(contenuto, {
        type: "array",
        cellDates: true,
      });

      const controlliTrovati: Controllo[] = [];

      workbook.SheetNames.forEach((nomeFoglio) => {
        const foglio = workbook.Sheets[nomeFoglio];

        const righe = XLSX.utils.sheet_to_json<RigaExcel>(foglio, {
          defval: "",
          raw: false,
        });

        righe.forEach((riga, indice) => {
          const titolo = testo(riga["Aggiorna titolo"]);

          const foglioVeicolo =
            nomeFoglio.toUpperCase().includes("VERIFICA MEZZO") ||
            titolo.toUpperCase().startsWith("VERIFICA MEZZO");

          if (!foglioVeicolo || !titolo) return;

          const { numeroChiave, targa } = extractVehicleInfo(titolo);

          controlliTrovati.push({
            id: `${nomeFoglio}-${indice}`,
            numeroChiave,
            targa,
            dataControllo: formattaData(riga["DATA CONTROLLO"]),
            operatore:
              testo(riga["Nome del mittente"]) ||
              testo(riga["Nome"]) ||
              testo(riga["E-mail del mittente"]),
            km: testo(riga["KM MEZZO"]),
            spie: testo(riga["SPIE"]),
            pneumatici: testo(riga["STATO PNEUMATICI"]),
            anomalie: testo(riga["ANOMALIE / MALFUNZIONAMENTI"]),
            problemaBloccante: testo(riga["PROBLEMA BLOCCANTE"]),
          });
        });
      });

      controlliTrovati.sort((a, b) => {
        const numeroA = Number.parseInt(a.numeroChiave, 10);
        const numeroB = Number.parseInt(b.numeroChiave, 10);

        if (Number.isNaN(numeroA) && Number.isNaN(numeroB)) return 0;
        if (Number.isNaN(numeroA)) return 1;
        if (Number.isNaN(numeroB)) return -1;

        return numeroA - numeroB;
      });

      setControlli(controlliTrovati);

      if (controlliTrovati.length === 0) {
        setErrore(
          'Non sono state trovate verifiche. Controlla che il file contenga il campo "Aggiorna titolo".'
        );
      }
    } catch (error) {
      console.error(error);
      setErrore(
        "Non è stato possibile leggere il file. Verifica che sia un file Excel valido."
      );
    } finally {
      setCaricamento(false);
    }
  }

  const mezziUnici = new Set(
    controlli.map((controllo) => controllo.numeroChiave || controllo.targa)
  ).size;

  const numeroAnomalie = controlli.filter((controllo) =>
    contieneProblema(controllo.anomalie)
  ).length;

  const numeroBloccanti = controlli.filter((controllo) =>
    contieneProblema(controllo.problemaBloccante)
  ).length;

  return (
    <main style={stili.pagina}>
      <div style={stili.intestazione}>
        <h1 style={stili.titolo}>📋 Controlli Mezzi</h1>

        <p style={stili.sottotitolo}>
          Importa il file Excel esportato da Microsoft Teams.
        </p>
      </div>

      <section style={stili.areaCaricamento}>
        <div style={stili.iconaExcel}>📊</div>

        <p style={stili.testoCaricamento}>
          Seleziona il file Excel dei controlli mezzi
        </p>

        <label style={stili.pulsante}>
          Seleziona file

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>

        {fileName && (
          <p style={stili.nomeFile}>
            File selezionato: <strong>{fileName}</strong>
          </p>
        )}

        {caricamento && (
          <p style={stili.messaggio}>Analisi del file in corso...</p>
        )}

        {errore && <p style={stili.errore}>{errore}</p>}
      </section>

      {controlli.length > 0 && (
        <>
          <section style={stili.grigliaRiepilogo}>
            <div style={stili.card}>
              <span style={stili.numeroCard}>{controlli.length}</span>
              <span style={stili.etichettaCard}>Verifiche</span>
            </div>

            <div style={stili.card}>
              <span style={stili.numeroCard}>{mezziUnici}</span>
              <span style={stili.etichettaCard}>Mezzi</span>
            </div>

            <div style={stili.card}>
              <span style={stili.numeroCard}>{numeroAnomalie}</span>
              <span style={stili.etichettaCard}>Anomalie</span>
            </div>

            <div style={stili.card}>
              <span style={stili.numeroCard}>{numeroBloccanti}</span>
              <span style={stili.etichettaCard}>Problemi bloccanti</span>
            </div>
          </section>

          <section style={stili.sezioneTabella}>
            <h2 style={stili.titoloTabella}>Anteprima controlli</h2>

            <div style={stili.contenitoreTabella}>
              <table style={stili.tabella}>
                <thead>
                  <tr>
                    <th style={stili.cellaIntestazione}>N. chiave</th>
                    <th style={stili.cellaIntestazione}>Targa</th>
                    <th style={stili.cellaIntestazione}>Data controllo</th>
                    <th style={stili.cellaIntestazione}>Operatore</th>
                    <th style={stili.cellaIntestazione}>Km</th>
                    <th style={stili.cellaIntestazione}>Spie</th>
                    <th style={stili.cellaIntestazione}>Pneumatici</th>
                    <th style={stili.cellaIntestazione}>Problema</th>
                  </tr>
                </thead>

                <tbody>
                  {controlli.map((controllo) => {
                    const haAnomalia = contieneProblema(controllo.anomalie);
                    const bloccante = contieneProblema(
                      controllo.problemaBloccante
                    );

                    return (
                      <tr key={controllo.id}>
                        <td style={stili.cella}>
                          <strong>{controllo.numeroChiave || "—"}</strong>
                        </td>

                        <td style={stili.cella}>{controllo.targa || "—"}</td>

                        <td style={stili.cella}>
                          {controllo.dataControllo || "—"}
                        </td>

                        <td style={stili.cella}>
                          {controllo.operatore || "—"}
                        </td>

                        <td style={stili.cella}>{controllo.km || "—"}</td>

                        <td style={stili.cella}>{controllo.spie || "—"}</td>

                        <td style={stili.cella}>
                          {controllo.pneumatici || "—"}
                        </td>

                        <td style={stili.cella}>
                          {bloccante ? (
                            <span style={stili.badgeRosso}>Bloccante</span>
                          ) : haAnomalia ? (
                            <span style={stili.badgeArancione}>Anomalia</span>
                          ) : (
                            <span style={stili.badgeVerde}>Regolare</span>
                          )}

                          {haAnomalia && (
                            <div style={stili.dettaglioProblema}>
                              {controllo.anomalie}
                            </div>
                          )}

                          {bloccante && (
                            <div style={stili.dettaglioProblema}>
                              {controllo.problemaBloccante}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

const stili: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: "100vh",
    padding: "32px",
    backgroundColor: "#f5f5f5",
    color: "#3c3c3b",
    fontFamily: "Arial, sans-serif",
  },

  intestazione: {
    marginBottom: "24px",
  },

  titolo: {
    margin: 0,
    fontSize: "32px",
  },

  sottotitolo: {
    marginTop: "8px",
    color: "#666666",
  },

  areaCaricamento: {
    padding: "36px",
    border: "2px dashed #c8c8c8",
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    textAlign: "center",
  },

  iconaExcel: {
    fontSize: "42px",
  },

  testoCaricamento: {
    marginBottom: "22px",
    fontSize: "17px",
    fontWeight: 600,
  },

  pulsante: {
    display: "inline-block",
    padding: "12px 24px",
    borderRadius: "8px",
    backgroundColor: "#e6007e",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },

  nomeFile: {
    marginTop: "18px",
    color: "#3c3c3b",
  },

  messaggio: {
    marginTop: "16px",
    color: "#555555",
  },

  errore: {
    marginTop: "16px",
    color: "#b00020",
    fontWeight: 700,
  },

  grigliaRiepilogo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "24px",
  },

  card: {
    display: "flex",
    flexDirection: "column",
    padding: "22px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },

  numeroCard: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#e6007e",
  },

  etichettaCard: {
    marginTop: "5px",
    color: "#666666",
  },

  sezioneTabella: {
    marginTop: "28px",
    padding: "24px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
  },

  titoloTabella: {
    marginTop: 0,
  },

  contenitoreTabella: {
    width: "100%",
    overflowX: "auto",
  },

  tabella: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
  },

  cellaIntestazione: {
    padding: "12px",
    borderBottom: "2px solid #dddddd",
    backgroundColor: "#3c3c3b",
    color: "#ffffff",
    textAlign: "left",
    whiteSpace: "nowrap",
  },

  cella: {
    padding: "12px",
    borderBottom: "1px solid #e5e5e5",
    verticalAlign: "top",
  },

  badgeRosso: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    backgroundColor: "#ffd7d7",
    color: "#a60000",
    fontSize: "12px",
    fontWeight: 700,
  },

  badgeArancione: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    backgroundColor: "#ffe4bd",
    color: "#8a4b00",
    fontSize: "12px",
    fontWeight: 700,
  },

  badgeVerde: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    backgroundColor: "#d9f5df",
    color: "#116b2d",
    fontSize: "12px",
    fontWeight: 700,
  },

  dettaglioProblema: {
    maxWidth: "280px",
    marginTop: "7px",
    fontSize: "12px",
    lineHeight: 1.4,
  },
};
