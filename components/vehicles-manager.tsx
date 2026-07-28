"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
};

type VehicleForm = Omit<Vehicle, "id">;

const emptyForm: VehicleForm = {
  targa: "",
  marca: "",
  modello: "",
  reparto: "",
  responsabile: "",
  detentore_chiavi: "",
  stato: "disponibile",
  motivo_stato: "",
  attivo: true,
  note: ""
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

export function VehiclesManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("tutti");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VehicleForm>(emptyForm);

  async function loadVehicles() {
    if (!supabase) {
      setError("Connessione Supabase non configurata.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("mezzi")
      .select("id,targa,marca,modello,reparto,responsabile,detentore_chiavi,stato,motivo_stato,attivo,note")
      .order("targa", { ascending: true });

    if (loadError) setError(loadError.message);
    else setVehicles((data ?? []) as Vehicle[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesText = !normalized || [vehicle.targa, vehicle.marca, vehicle.modello, vehicle.reparto]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
      const matchesStatus = statusFilter === "tutti" || vehicle.stato === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [vehicles, query, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setIsOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditingId(vehicle.id);
    setForm({
      targa: vehicle.targa,
      marca: vehicle.marca ?? "",
      modello: vehicle.modello ?? "",
      reparto: vehicle.reparto ?? "",
      responsabile: vehicle.responsabile ?? "",
      detentore_chiavi: vehicle.detentore_chiavi ?? "",
      stato: vehicle.stato,
      motivo_stato: vehicle.motivo_stato ?? "",
      attivo: vehicle.attivo,
      note: vehicle.note ?? ""
    });
    setIsOpen(true);
  }

  async function saveVehicle(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    const targa = form.targa.replace(/\s+/g, "").toUpperCase();
    if (!targa) {
      setError("La targa è obbligatoria.");
      return;
    }

    setSaving(true);
    setError("");
    const payload = { ...form, targa };
    const result = editingId
      ? await supabase.from("mezzi").update(payload).eq("id", editingId)
      : await supabase.from("mezzi").insert(payload);

    if (result.error) setError(result.error.message);
    else {
      setIsOpen(false);
      await loadVehicles();
    }
    setSaving(false);
  }

  async function deleteVehicle(vehicle: Vehicle) {
    if (!supabase) return;
    if (!window.confirm(`Eliminare il mezzo ${vehicle.targa}?`)) return;

    const { error: deleteError } = await supabase.from("mezzi").delete().eq("id", vehicle.id);
    if (deleteError) setError(deleteError.message);
    else await loadVehicles();
  }

  return (
    <>
      <section className="pageIntro">
        <div><p className="eyebrow">Anagrafica</p><h2>Mezzi</h2></div>
        <button className="primaryButton" onClick={openCreate}><Plus size={18} /> Aggiungi mezzo</button>
      </section>

      {error && <div className="errorBanner">{error}</div>}

      <section className="panel vehiclePanel">
        <div className="toolbar">
          <label className="searchBox"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca targa, marca, modello o reparto" /></label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="tutti">Tutti gli stati</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {loading ? <div className="emptyState">Caricamento mezzi…</div> : filteredVehicles.length === 0 ? (
          <div className="emptyState">Nessun mezzo trovato. Premi “Aggiungi mezzo” per inserire il primo.</div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead><tr><th>Targa</th><th>Marca e modello</th><th>Reparto</th><th>Responsabile</th><th>Stato</th><th>Attivo</th><th></th></tr></thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td><strong>{vehicle.targa}</strong></td>
                    <td>{[vehicle.marca, vehicle.modello].filter(Boolean).join(" ") || "—"}</td>
                    <td>{vehicle.reparto || "—"}</td>
                    <td>{vehicle.responsabile || "—"}</td>
                    <td><span className={`statusBadge status-${vehicle.stato}`}>{statusLabels[vehicle.stato]}</span></td>
                    <td>{vehicle.attivo ? "Sì" : "No"}</td>
                    <td><div className="rowActions"><button className="iconButton" title="Modifica" onClick={() => openEdit(vehicle)}><Pencil size={17} /></button><button className="iconButton danger" title="Elimina" onClick={() => void deleteVehicle(vehicle)}><Trash2 size={17} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isOpen && (
        <div className="modalBackdrop" onMouseDown={() => setIsOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader"><div><p className="eyebrow">Anagrafica mezzo</p><h3>{editingId ? "Modifica mezzo" : "Nuovo mezzo"}</h3></div><button className="iconButton" onClick={() => setIsOpen(false)}><X size={20} /></button></div>
            <form onSubmit={saveVehicle} className="vehicleForm">
              <label>Targa *<input required value={form.targa} onChange={(e) => setForm({ ...form, targa: e.target.value })} placeholder="AB123CD" /></label>
              <label>Marca<input value={form.marca ?? ""} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></label>
              <label>Modello<input value={form.modello ?? ""} onChange={(e) => setForm({ ...form, modello: e.target.value })} /></label>
              <label>Reparto<input value={form.reparto ?? ""} onChange={(e) => setForm({ ...form, reparto: e.target.value })} /></label>
              <label>Responsabile<input value={form.responsabile ?? ""} onChange={(e) => setForm({ ...form, responsabile: e.target.value })} /></label>
              <label>Detentore chiavi<input value={form.detentore_chiavi ?? ""} onChange={(e) => setForm({ ...form, detentore_chiavi: e.target.value })} /></label>
              <label>Stato<select value={form.stato} onChange={(e) => setForm({ ...form, stato: e.target.value as VehicleStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Motivo stato<input value={form.motivo_stato ?? ""} onChange={(e) => setForm({ ...form, motivo_stato: e.target.value })} /></label>
              <label className="fullField">Note<textarea rows={3} value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
              <label className="checkField"><input type="checkbox" checked={form.attivo} onChange={(e) => setForm({ ...form, attivo: e.target.checked })} /> Mezzo attivo</label>
              <div className="formActions"><button type="button" className="secondaryButton" onClick={() => setIsOpen(false)}>Annulla</button><button type="submit" className="primaryButton" disabled={saving}>{saving ? "Salvataggio…" : "Salva mezzo"}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
