import { AlertTriangle, CalendarCheck, Car, Ticket } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const cards = [
  { label: "Mezzi attivi", value: "0", icon: Car },
  { label: "Prenotazioni oggi", value: "0", icon: CalendarCheck },
  { label: "Ticket aperti", value: "0", icon: Ticket },
  { label: "Problemi bloccanti", value: "0", icon: AlertTriangle }
];

export default function Dashboard() {
  return (
    <PageShell>
      <section className="pageIntro">
        <div><p className="eyebrow">Panoramica</p><h2>Dashboard</h2></div>
        <button className="primaryButton">Nuova prenotazione</button>
      </section>
      <section className="cardsGrid">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="statCard" key={label}>
            <div className="iconBox"><Icon size={21} /></div>
            <p>{label}</p><strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="panel">
        <div className="panelHeader"><div><p className="eyebrow">Attività</p><h3>Situazione operativa</h3></div></div>
        <div className="emptyState">Il collegamento a Supabase sarà attivato con le variabili d'ambiente su Vercel.</div>
      </section>
    </PageShell>
  );
}
