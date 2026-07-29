"use client";

import { ChangeEvent, useState } from "react";
import UploadExcel from "../../components/controlli/UploadExcel";
import DashboardControlli from "../../components/controlli/DashboardControlli";
import AnteprimaControlli from "../../components/controlli/AnteprimaControlli";
import AzioniImportazione from "../../components/controlli/AzioniImportazione";
import {
  leggiFileControlli,
  type Controllo,
} from "../../lib/controlli/parserExcel";
import {
  creaMezziMancanti,
  type RisultatoCreazioneMezzi,
} from "../../lib/controlli/creaMezzi";
import {
  importaControlli,
  type RisultatoImportazione,
} from "../../lib/controlli/importaControlli";

export default function ControlliPage() {
  const [fileName, setFileName] = useState("");
  const [controlli, setControlli] = useState<Controllo[]>([]);
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const [occupato, setOccupato] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [risultatoMezzi, setRisultatoMezzi] =
    useState<RisultatoCreazioneMezzi | null>(null);
  const [risultatoImportazione, setRisultatoImportazione] =
    useState<RisultatoImportazione | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setControlli([]);
    setErrore("");
    setMessaggio("");
    setRisultatoMezzi(null);
    setRisultatoImportazione(null);
    setCaricamento(true);

    try {
      const dati = await leggiFileControlli(file);
      setControlli(dati);
      if (dati.length === 0) {
        setErrore('Nessuna verifica trovata. Controlla il campo "Aggiorna titolo".');
      }
    } catch (error) {
      console.error(error);
      setErrore("Non è stato possibile leggere il file Excel.");
    } finally {
      setCaricamento(false);
    }
  }

  async function handleCreaMezzi() {
    if (!controlli.length) return;
    if (!window.confirm("Vuoi creare automaticamente i mezzi mancanti?")) return;

    setOccupato(true);
    setErrore("");
    setMessaggio("Creazione mezzi in corso...");
    setRisultatoMezzi(null);
    setRisultatoImportazione(null);

    try {
      const risultato = await creaMezziMancanti(controlli);
      setRisultatoMezzi(risultato);
      setMessaggio("Creazione mezzi completata.");
    } catch (error) {
      console.error(error);
      setMessaggio("");
      setErrore("Errore durante la creazione dei mezzi.");
    } finally {
      setOccupato(false);
    }
  }

  async function handleImporta() {
    if (!controlli.length) return;
    if (!window.confirm(`Vuoi importare ${controlli.length} controlli?`)) return;

    setOccupato(true);
    setErrore("");
    setMessaggio("Importazione controlli in corso...");
    setRisultatoMezzi(null);
    setRisultatoImportazione(null);

    try {
      const risultato = await importaControlli(controlli);
      setRisultatoImportazione(risultato);
      setMessaggio(
        risultato.errori === 0
          ? "Importazione completata."
          : "Importazione completata con alcuni errori."
      );
    } catch (error) {
      console.error(error);
      setMessaggio("");
      setErrore("Errore durante l'importazione dei controlli.");
    } finally {
      setOccupato(false);
    }
  }

  return (
    <main style={stili.pagina}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={stili.titolo}>📋 Controlli Mezzi</h1>
        <p style={stili.sottotitolo}>
          Importa il file Excel esportato da Microsoft Teams.
        </p>
      </header>

      <UploadExcel
        fileName={fileName}
        caricamento={caricamento}
        errore={errore}
        onChange={handleFileChange}
      />

      {controlli.length > 0 && (
        <>
          <DashboardControlli controlli={controlli} />
          <AzioniImportazione
            occupato={occupato}
            messaggio={messaggio}
            risultatoMezzi={risultatoMezzi}
            risultatoImportazione={risultatoImportazione}
            onCreaMezzi={handleCreaMezzi}
            onImporta={handleImporta}
          />
          <AnteprimaControlli controlli={controlli} />
        </>
      )}
    </main>
  );
}

const stili: Record<string, React.CSSProperties> = {
  pagina: {
    minHeight: "100vh",
    padding: 32,
    backgroundColor: "#f5f5f5",
    color: "#3c3c3b",
    fontFamily: "Arial, sans-serif",
  },
  titolo: { margin: 0, fontSize: 32 },
  sottotitolo: { marginTop: 8, color: "#666666" },
};
