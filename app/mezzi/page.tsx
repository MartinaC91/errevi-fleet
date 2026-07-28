import { PageShell } from "@/components/page-shell";

export default function MezziPage() {
  return (
    <PageShell>
      <section className="pageIntro"><div><p className="eyebrow">Anagrafica</p><h2>Mezzi</h2></div><button className="primaryButton">Aggiungi mezzo</button></section>
      <section className="panel"><div className="emptyState">Nessun mezzo visualizzato. Configura Supabase e le policy RLS per leggere la tabella mezzi.</div></section>
    </PageShell>
  );
}
