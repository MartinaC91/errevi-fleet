import { supabase } from "../supabase";
import type { Controllo } from "./parserExcel";
import { convertiKm, normalizzaTarga } from "./utils";

export type RisultatoImportazione = {
  importati: number;
  duplicati: number;
  mezziNonTrovati: number;
  errori: number;
};

type MezzoDb = {
  id: string;
  numero_chiave: string | null;
  targa: string | null;
  km_attuali: number | null;
};

function creaChiaveUnivoca(controllo: Controllo): string {
  const mezzo = controllo.numeroChiave || controllo.targa || "sconosciuto";
  const data =
    controllo.dataControlloIso || controllo.dataControllo || "senza-data";
  const km = convertiKm(controllo.km) ?? "senza-km";
  const operatore =
    controllo.operatore.trim().toLowerCase().replace(/\s+/g, "-") ||
    "senza-operatore";
  return `${mezzo}-${data}-${km}-${operatore}`;
}

export async function importaControlli(
  controlli: Controllo[]
): Promise<RisultatoImportazione> {
  if (!supabase) throw new Error("Supabase non è configurato.");

  const risultato: RisultatoImportazione = {
    importati: 0,
    duplicati: 0,
    mezziNonTrovati: 0,
    errori: 0,
  };

  const { data: mezzi, error: erroreMezzi } = await supabase
    .from("mezzi")
    .select("id, numero_chiave, targa, km_attuali");
  if (erroreMezzi) throw erroreMezzi;

  const perChiave = new Map<string, MezzoDb>();
  const perTarga = new Map<string, MezzoDb>();
  for (const mezzo of (mezzi ?? []) as MezzoDb[]) {
    if (mezzo.numero_chiave) perChiave.set(mezzo.numero_chiave.trim(), mezzo);
    if (mezzo.targa) perTarga.set(normalizzaTarga(mezzo.targa), mezzo);
  }

  for (const controllo of controlli) {
    try {
      const mezzo =
        perChiave.get(controllo.numeroChiave.trim()) ||
        perTarga.get(normalizzaTarga(controllo.targa));

      if (!mezzo) {
        risultato.mezziNonTrovati += 1;
        continue;
      }

      const chiaveUnivoca = creaChiaveUnivoca(controllo);
      const { data: esistente, error: erroreVerifica } = await supabase
        .from("ispezioni")
        .select("id")
        .eq("chiave_univoca", chiaveUnivoca)
        .maybeSingle();
      if (erroreVerifica) throw erroreVerifica;

      if (esistente) {
        risultato.duplicati += 1;
        continue;
      }

      const km = convertiKm(controllo.km);
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

      if (km !== null && km >= (mezzo.km_attuali ?? 0)) {
        const { error: erroreAggiornamento } = await supabase
          .from("mezzi")
          .update({ km_attuali: km })
          .eq("id", mezzo.id);
        if (erroreAggiornamento) throw erroreAggiornamento;
        mezzo.km_attuali = km;
      }

      risultato.importati += 1;
    } catch (error) {
      console.error("Errore importazione controllo", controllo, error);
      risultato.errori += 1;
    }
  }

  return risultato;
}
