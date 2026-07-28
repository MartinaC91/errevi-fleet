import { PageShell } from "@/components/page-shell";

export default function PrenotazioniPage() {
  return (
    <PageShell>
      <section className="pageIntro"><div><p className="eyebrow">Calendario</p><h2>Prenotazioni</h2></div><button className="primaryButton">Nuova richiesta</button></section>
      <section className="panel"><div className="emptyState">Il calendario delle prenotazioni sarà disponibile nel prossimo rilascio.</div></section>
    </PageShell>
  );
}
