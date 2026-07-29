"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

type RigaExcel = Record<string, unknown>;

type Controllo = {
  id: string;
  numeroChiave: string;
  targa: string;
  dataControllo: string;
  dataControlloIso: string | null;
  operatore: string;
  emailOperatore: string;
  km: string;
  puliziaEsterna: string;
  puliziaInterna: string;
  spie: string;
  pneumatici: string;
  urtiDanni: string;
  anomalie: string;
  problemaBloccante: string;
  allegato: string;
};

type RisultatoImportazione = {
  importati: number;
  duplicati: number;
  mezziNonTrovati: number;
  errori: number;
};

function testo(valore: unknown): string {
  if (valore === null || valore === undefined) return "";
  return String(valore).trim();
}

function normalizzaTarga(targa: string): string {
  return targa.replace(/\s+/g, "").toUpperCase();
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
    targa: normalizzaTarga(risultato[2]),
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
    "regolare",
  ];

  return !valoriNegativi.includes(valorePulito);
}

function ottieniData(valore: unknown): {
  visualizzata: string;
  iso: string | null;
} {
  if (!valore) {
    return {
      visualizzata: "",
      iso: null,
    };
  }

  if (valore instanceof Date && !Number.isNaN(valore.getTime())) {
    const anno = valore.getFullYear();
    const mese = String(valore.getMonth() + 1).padStart(2, "0");
    const giorno = String(valore.getDate()).padStart(2, "0");

    return {
      visualizzata: valore.toLocaleDateString("it-IT"),
      iso: `${anno}-${mese}-${giorno}`,
    };
  }

  if (typeof valore === "number") {
    const dataExcel = XLSX.SSF.parse_date_code(valore);

    if (dataExcel) {
      const mese = String(dataExcel.m).padStart(2, "0");
      const giorno = String(dataExcel.d).padStart(2, "0");

      return {
        visualizzata: `${giorno}/${mese}/${dataExcel.y}`,
        iso: `${dataExcel.y}-${mese}-${giorno}`,
      };
    }
  }

  const valoreTesto = testo(valore);

  const formatoItaliano = valoreTesto.match(
    /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/
  );

  if (formatoItaliano) {
    const giorno = formatoItaliano[1].padStart(2, "0");
    const mese = formatoItaliano[2].padStart(2, "0");
    const anno = formatoItaliano[3];

    return {
      visualizzata: `${giorno}/${mese}/${anno}`,
      iso: `${anno}-${mese}-${giorno}`,
    };
  }

  const formatoIso = valoreTesto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (formatoIso) {
    return {
      visualizzata: `${formatoIso[3]}/${formatoIso[2]}/${formatoIso[1]}`,
      iso: `${formatoIso[1]}-${formatoIso[2]}-${formatoIso[3]}`,
    };
  }

  return {
    visualizzata: valoreTesto,
    iso: null,
  };
}

function convertiKm(valore: string): number | null {
  if (!valore.trim()) return null;

  const soloNumeri = valore.replace(/[^\d]/g, "");

  if (!soloNumeri) return null;

  const km = Number.parseInt(soloNumeri, 10);

  return Number.isNaN(km) ? null : km;
}

function creaChiaveUnivoca(controllo: Controllo): string {
  const mezzo = controllo.numeroChiave || controllo.targa || "sconosciuto";
  const data = controllo.dataControlloIso || controllo.dataControllo || "senza-data";
  const km = convertiKm(controllo.km) ?? "senza-km";
  const operatore = controllo.operatore
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `${mezzo}-${data}-${km}-${operatore || "senza-operatore"}`;
}

export default function ControlliPage() {
  const [fileName, setFileName] = useState("");
  const [controlli, setControlli] = useState<Controllo[]>([]);
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const [importazione, setImportazione] = useState(false);
  const [messaggioImportazione, setMessaggioImportazione] = useState("");
  const [risultatoImportazione, setRisultatoImportazione] =
    useState<RisultatoImportazione | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setControlli([]);
    setErrore("");
    setMessaggioImportazione("");
    setRisultatoImportazione(null);
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
          const data = ottieniData(riga["DATA CONTROLLO"]);

          controlliTrovati.push({
            id: `${nomeFoglio}-${indice}`,
            numeroChiave,
            targa,
            dataControllo: data.visualizzata,
            dataControlloIso: data.iso,
            operatore:
              testo(riga["Nome del mittente"]) ||
              testo(riga["Nome"]) ||
              testo(riga["E-mail del mittente"]),
            emailOperatore:
              testo(riga["E-mail del mittente"]) ||
              testo(riga["Email del mittente"]),
            km: testo(riga["KM MEZZO"]),
            puliziaEsterna: testo(riga["PULIZIA ESTERNA"]),
            puliziaInterna: testo(riga["PULIZIA INTERNA"]),
            spie: testo(riga["SPIE"]),
            pneumatici: testo(riga["STATO PNEUMATICI"]),
            urtiDanni:
              testo(riga["URTI / DANNI"]) ||
              testo(riga["URTI/DANNI"]) ||
              testo(riga["URTI E DANNI"]),
            anomalie: testo(riga["ANOMALIE / MALFUNZIONAMENTI"]),
            problemaBloccante: testo(riga["PROBLEMA BLOCCANTE"]),
            allegato:
              testo(riga["Allegati"]) ||
              testo(riga["ALLEGATO"]) ||
              testo(riga["ALLEGATI"]),
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

  async function trovaMezzo(controllo: Controllo) {
    if (!supabase) {
      throw new Error("Supabase non è configurato.");
    }

    if (controllo.numeroChiave) {
      const { data, error } = await supabase
        .from("mezzi")
        .select("id, numero_chiave, targa, km_attuali")
        .eq("numero_chiave", controllo.numeroChiave)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;
    }

    if (controllo.targa) {
      const { data, error } = await supabase
        .from("mezzi")
        .select("id, numero_chiave, targa, km_attuali")
        .eq("targa", controllo.targa)
        .maybeSingle();

      if (error) throw error;
      if (data) return data;

      const { data: tuttiIMezzi, error: erroreMezzi } = await supabase
        .from("mezzi")
        .select("id, numero_chiave, targa, km_attuali");

      if (erroreMezzi) throw erroreMezzi;

      const mezzoConTargaNormalizzata = tuttiIMezzi?.find(
        (mezzo) => normalizzaTarga(mezzo.targa ?? "") === controllo.targa
      );

      if (mezzoConTargaNormalizzata) {
        return mezzoConTargaNormalizzata;
      }
    }

    return null;
  }

  async function importaControlli() {
    if (!supabase) {
      setErrore(
        "Supabase non è configurato. Controlla le variabili ambiente del progetto."
      );
      return;
    }

    if (controlli.length === 0) return;

    const conferma = window.confirm(
      `Vuoi importare ${controlli.length} controlli in Supabase?`
    );

    if (!conferma) return;

    setImportazione(true);
    setErrore("");
    setMessaggioImportazione("Importazione in corso...");
    setRisultatoImportazione(null);

    const risultato: RisultatoImportazione = {
      importati: 0,
      duplicati: 0,
      mezziNonTrovati: 0,
      errori: 0,
    };

    try {
      for (const controllo of controlli) {
        try {
          const mezzo = await trovaMezzo(controllo);

          if (!mezzo) {
            risultato.mezziNonTrovati += 1;
            continue;
          }

          const chiaveUnivoca = creaChiaveUnivoca(controllo);
          const km = convertiKm(controllo.km);

          const { data: ispezioneEsistente, error: erroreControllo } =
            await supabase
              .from("ispezioni")
              .select("id")
              .eq("chiave_univoca", chiaveUnivoca)
              .maybeSingle();

          if (erroreControllo) throw erroreControllo;

          if (ispezioneEsistente) {
            risultato.duplicati += 1;
            continue;
          }

          const { error: erroreInserimento } = await supabase
            .from("ispezioni")
            .insert({
              mezzo_id: mezzo.id,
              numero_chiave: controllo.numeroChiave,
              targa: controllo.targa,
              data_controllo: controllo.dataControlloIso,
              data_invio: new Date().toISOString(),
              operatore: controllo.operatore || null,
              email_operatore: controllo.emailOperatore || null,
              km,
              pulizia_esterna: controllo.puliziaEsterna || null,
              pulizia_interna: controllo.puliziaInterna || null,
              spie: controllo.spie || null,
              stato_pneumatici: controllo.pneumatici || null,
              urti_danni: controllo.urtiDanni || null,
              anomalie: controllo.anomalie || null,
              problema_bloccante: controllo.problemaBloccante || null,
              allegato: controllo.allegato || null,
              chiave_univoca: chiaveUnivoca,
            });

          if (erroreInserimento) {
            if (erroreInserimento.code === "23505") {
              risultato.duplicati += 1;
              continue;
            }

            throw erroreInserimento;
          }

          if (km !== null) {
            const kmAttuali =
              typeof mezzo.km_attuali === "number" ? mezzo.km_attuali : 0;

            if (km >= kmAttuali) {
              const { error: erroreAggiornamento } = await supabase
                .from("mezzi")
                .update({ km_attuali: km })
                .eq("id", mezzo.id);

              if (erroreAggiornamento) throw erroreAggiornamento;
            }
          }

          risultato.importati += 1;
        } catch (error) {
          console.error("Errore durante l'importazione del controllo:", error);
          risultato.errori += 1;
        }
      }

      setRisultatoImportazione(risultato);

      setMessaggioImportazione(
        risultato.errori === 0
          ? "Importazione completata."
          : "Importazione completata con alcuni errori."
      );
    } catch (error) {
      console.error(error);
      setErrore("Si è verificato un errore durante l'importazione.");
      setMessaggioImportazione("");
    } finally {
      setImportazione(false);
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

          <section style={stili.areaImportazione}>
            <div>
              <h2 style={stili.titoloImportazione}>
                Importazione nel gestionale
              </h2>

              <p style={stili.testoImportazione}>
                I controlli già presenti saranno riconosciuti e non verranno
                duplicati.
              </p>
            </div>

            <button
              type="button"
              onClick={importaControlli}
              disabled={importazione}
              style={{
                ...stili.pulsanteImportazione,
                ...(importazione ? stili.pulsanteDisabilitato : {}),
              }}
            >
              {importazione
                ? "Importazione in corso..."
                : "Importa in Supabase"}
            </button>
          </section>

          {messaggioImportazione && (
            <section style={stili.esitoImportazione}>
              <strong>{messaggioImportazione}</strong>

              {risultatoImportazione && (
                <div style={stili.grigliaEsito}>
                  <span>✅ Importati: {risultatoImportazione.importati}</span>
                  <span>↩️ Già presenti: {risultatoImportazione.duplicati}</span>
                  <span>
                    🚗 Mezzi non trovati:{" "}
                    {risultatoImportazione.mezziNonTrovati}
                  </span>
                  <span>⚠️ Errori: {risultatoImportazione.errori}</span>
                </div>
              )}
            </section>
          )}

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

  areaImportazione: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    flexWrap: "wrap",
    marginTop: "24px",
    padding: "24px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },

  titoloImportazione: {
    margin: 0,
    fontSize: "20px",
  },

  testoImportazione: {
    marginTop: "7px",
    marginBottom: 0,
    color: "#666666",
  },

  pulsanteImportazione: {
    padding: "13px 24px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#e6007e",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  pulsanteDisabilitato: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  esitoImportazione: {
    marginTop: "18px",
    padding: "20px",
    border: "1px solid #b9dfc2",
    borderRadius: "10px",
    backgroundColor: "#eef9f0",
  },

  grigliaEsito: {
    display: "flex",
    flexWrap: "wrap",
    gap: "18px",
    marginTop: "12px",
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
