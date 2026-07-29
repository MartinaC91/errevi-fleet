import * as XLSX from "xlsx";

export function testo(valore: unknown): string {
  if (valore === null || valore === undefined) return "";
  return String(valore).trim();
}

export function normalizzaTarga(targa: string): string {
  return targa.replace(/\s+/g, "").toUpperCase();
}

export function estraiDatiMezzo(titolo: string): {
  numeroChiave: string;
  targa: string;
} {
  const risultato = titolo
    .trim()
    .match(/VERIFICA\s+MEZZO\s*-\s*([^-]+?)\s*-\s*(.+)$/i);

  if (!risultato) return { numeroChiave: "", targa: "" };

  return {
    numeroChiave: risultato[1].trim(),
    targa: normalizzaTarga(risultato[2]),
  };
}

export function contieneProblema(valore: string): boolean {
  const valorePulito = valore.trim().toLowerCase();
  if (!valorePulito) return false;

  return ![
    "no",
    "nessuno",
    "nessuna",
    "nessun problema",
    "non presente",
    "n/a",
    "ok",
    "regolare",
  ].includes(valorePulito);
}

export function ottieniData(valore: unknown): {
  visualizzata: string;
  iso: string | null;
} {
  if (!valore) return { visualizzata: "", iso: null };

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

  return { visualizzata: valoreTesto, iso: null };
}

export function convertiKm(valore: string): number | null {
  if (!valore.trim()) return null;
  const soloNumeri = valore.replace(/[^\d]/g, "");
  if (!soloNumeri) return null;
  const km = Number.parseInt(soloNumeri, 10);
  return Number.isNaN(km) ? null : km;
}
