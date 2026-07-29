import * as XLSX from "xlsx";
import { estraiDatiMezzo, ottieniData, testo } from "./utils";

type RigaExcel = Record<string, unknown>;

export type Controllo = {
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

export async function leggiFileControlli(file: File): Promise<Controllo[]> {
  const contenuto = await file.arrayBuffer();
  const workbook = XLSX.read(contenuto, { type: "array", cellDates: true });
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

      const { numeroChiave, targa } = estraiDatiMezzo(titolo);
      if (!numeroChiave && !targa) return;

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
        puliziaEsterna:
          testo(riga["PULIZIA ESTERNA"]) || testo(riga["Pulizia esterna"]),
        puliziaInterna:
          testo(riga["PULIZIA INTERNA"]) || testo(riga["Pulizia interna"]),
        spie: testo(riga["SPIE"]),
        pneumatici:
          testo(riga["STATO PNEUMATICI"]) || testo(riga["Stato pneumatici"]),
        urtiDanni:
          testo(riga["URTI / DANNI"]) ||
          testo(riga["URTI/DANNI"]) ||
          testo(riga["URTI E DANNI"]),
        anomalie:
          testo(riga["ANOMALIE / MALFUNZIONAMENTI"]) ||
          testo(riga["ANOMALIE/MALFUNZIONAMENTI"]),
        problemaBloccante:
          testo(riga["PROBLEMA BLOCCANTE"]) ||
          testo(riga["Problema bloccante"]),
        allegato:
          testo(riga["Allegati"]) ||
          testo(riga["ALLEGATO"]) ||
          testo(riga["ALLEGATI"]),
      });
    });
  });

  return controlliTrovati.sort((a, b) => {
    const numeroA = Number.parseInt(a.numeroChiave, 10);
    const numeroB = Number.parseInt(b.numeroChiave, 10);
    if (Number.isNaN(numeroA) && Number.isNaN(numeroB)) {
      return a.targa.localeCompare(b.targa);
    }
    if (Number.isNaN(numeroA)) return 1;
    if (Number.isNaN(numeroB)) return -1;
    return numeroA - numeroB;
  });
}
