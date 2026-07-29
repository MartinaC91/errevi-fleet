import { supabase } from "../supabase";
import type { Controllo } from "./parserExcel";
import { normalizzaTarga } from "./utils";

export type RisultatoCreazioneMezzi = {
  trovatiNelFile: number;
  creati: number;
  giaPresenti: number;
  errori: number;
};

type MezzoMinimo = {
  numero_chiave: string;
  targa: string;
};

export async function creaMezziMancanti(
  controlli: Controllo[]
): Promise<RisultatoCreazioneMezzi> {
  if (!supabase) throw new Error("Supabase non è configurato.");

  const unici = new Map<string, MezzoMinimo>();
  for (const controllo of controlli) {
    const numeroChiave = controllo.numeroChiave.trim();
    const targa = normalizzaTarga(controllo.targa);
    if (!numeroChiave && !targa) continue;
    unici.set(numeroChiave || targa, {
      numero_chiave: numeroChiave,
      targa,
    });
  }

  const risultato: RisultatoCreazioneMezzi = {
    trovatiNelFile: unici.size,
    creati: 0,
    giaPresenti: 0,
    errori: 0,
  };

  const { data: esistenti, error } = await supabase
    .from("mezzi")
    .select("id, numero_chiave, targa");
  if (error) throw error;

  const chiaviEsistenti = new Set(
    (esistenti ?? []).map((mezzo) => String(mezzo.numero_chiave ?? "").trim())
  );
  const targheEsistenti = new Set(
    (esistenti ?? []).map((mezzo) => normalizzaTarga(String(mezzo.targa ?? "")))
  );

  for (const mezzo of unici.values()) {
    const giaPresente =
      (mezzo.numero_chiave && chiaviEsistenti.has(mezzo.numero_chiave)) ||
      (mezzo.targa && targheEsistenti.has(mezzo.targa));

    if (giaPresente) {
      risultato.giaPresenti += 1;
      continue;
    }

    const { error: erroreInserimento } = await supabase.from("mezzi").insert({
      numero_chiave: mezzo.numero_chiave || null,
      targa: mezzo.targa || null,
      km_attuali: null,
    });

    if (erroreInserimento) {
      console.error("Errore creazione mezzo", mezzo, erroreInserimento);
      risultato.errori += 1;
      continue;
    }

    risultato.creati += 1;
    if (mezzo.numero_chiave) chiaviEsistenti.add(mezzo.numero_chiave);
    if (mezzo.targa) targheEsistenti.add(mezzo.targa);
  }

  return risultato;
}
