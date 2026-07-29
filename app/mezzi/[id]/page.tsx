"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Car } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { supabase } from "@/lib/supabase";

type VehicleStatus =
  | "disponibile"
  | "prenotato"
  | "in_attesa_approvazione"
  | "manutenzione_programmata"
  | "guasto"
  | "revisione"
  | "fuori_servizio";

type Vehicle = {
  id: string;
  targa: string;
  marca: string | null;
  modello: string | null;
  reparto: string | null;
  responsabile: string | null;
  detentore_chiavi: string | null;
  stato: VehicleStatus;
  motivo_stato: string | null;
  attivo: boolean;
  note: string | null;
  numero_chiave: string | number | null;
  km_attuali: number | null;
};

const statusLabels: Record<VehicleStatus, string> = {
  disponibile: "Disponibile",
  prenotato: "Prenotato",
  in_attesa_approvazione: "In attesa approvazione",
  manutenzione_programmata: "Manutenzione programmata",
  guasto: "Guasto",
  revisione: "Revisione",
  fuori_servizio: "Fuori servizio"
};

export default function VehicleDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVehicle() {
      if (!supabase) {
        setError("Connessione Supabase non configurata.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("mezzi")
        .select(
          "id,targa,marca,modello,reparto,responsabile,detentore_chiavi,stato,motivo_stato,attivo,note,numero_chiave,km_attuali"
        )
        .eq("id", id)
        .single();

      if (loadError) {
        setError(loadError.message);
      } else {
        setVehicle(data as Vehicle);
      }

      setLoading(false);
    }

    void loadVehicle();
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="emptyState">Caricamento scheda mezzo…</div>
      </PageShell>
    );
  }

  if (error || !vehicle) {
    return (
      <PageShell>
        <Link href="/mezzi" className="secondaryButton">
          <ArrowLeft size={17} />
          Torna ai mezzi
        </Link>

        <div className="errorBanner" style={{ marginTop: 20 }}>
          {error || "Mezzo non trovato."}
        </div>
      </PageShell>
    );
  }

  const marcaModello =
    [vehicle.marca, vehicle.modello].filter(Boolean).join(" ") ||
    "Da completare";

  return (
    <PageShell>
      <section className="pageIntro">
        <div>
          <p className="eyebrow">Scheda mezzo</p>
          <h2>{vehicle.targa}</h2>
        </div>

        <Link href="/mezzi" className="secondaryButton">
          <ArrowLeft size={17} />
          Torna ai mezzi
        </Link>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Anagrafica</p>

            <h3>
              <Car
                size={20}
                style={{
                  verticalAlign: "middle",
                  marginRight: 8
                }}
              />

              {marcaModello}
            </h3>
          </div>

          <span className={`statusBadge status-${vehicle.stato}`}>
            {statusLabels[vehicle.stato]}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 16,
            marginTop: 20
          }}
        >
          <article className="statCard">
            <p>Targa</p>
            <strong>{vehicle.targa}</strong>
          </article>

          <article className="statCard">
            <p>Numero chiave</p>
            <strong>{vehicle.numero_chiave ?? "—"}</strong>
          </article>

          <article className="statCard">
            <p>Km attuali</p>
            <strong>
              {vehicle.km_attuali != null
                ? vehicle.km_attuali.toLocaleString("it-IT")
                : "—"}
            </strong>
          </article>

          <article className="statCard">
            <p>Attivo</p>
            <strong>{vehicle.attivo ? "Sì" : "No"}</strong>
          </article>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 24
          }}
        >
          <div>
            <p className="eyebrow">Reparto</p>
            <p>{vehicle.reparto || "Da assegnare"}</p>
          </div>

          <div>
            <p className="eyebrow">Responsabile</p>
            <p>{vehicle.responsabile || "Da assegnare"}</p>
          </div>

          <div>
            <p className="eyebrow">Detentore chiavi</p>
            <p>{vehicle.detentore_chiavi || "Da assegnare"}</p>
          </div>

          <div>
            <p className="eyebrow">Motivo stato</p>
            <p>{vehicle.motivo_stato || "—"}</p>
          </div>
        </div>

        {vehicle.note && (
          <div style={{ marginTop: 24 }}>
            <p className="eyebrow">Note</p>
            <p>{vehicle.note}</p>
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Controlli</p>
            <h3>Storico controlli</h3>
          </div>
        </div>

        <div className="emptyState">
          Nel prossimo passaggio collegheremo qui le ispezioni del mezzo.
        </div>
      </section>
    </PageShell>
  );
}
