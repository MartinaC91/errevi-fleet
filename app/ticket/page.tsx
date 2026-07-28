import { PageShell } from "@/components/page-shell";

export default function TicketPage() {
  return (
    <PageShell>
      <section className="pageIntro"><div><p className="eyebrow">Segnalazioni</p><h2>Ticket</h2></div><button className="primaryButton">Nuovo ticket</button></section>
      <section className="panel"><div className="emptyState">I ticket automatici verranno collegati ai controlli Teams.</div></section>
    </PageShell>
  );
}
