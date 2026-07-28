import Link from "next/link";
import { CalendarDays, Car, LayoutDashboard, Ticket } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mezzi", label: "Mezzi", icon: Car },
  { href: "/prenotazioni", label: "Prenotazioni", icon: CalendarDays },
  { href: "/ticket", label: "Ticket", icon: Ticket }
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand"><span>ERREVI</span><strong>FLEET</strong></div>
      <nav>
        {items.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className="navItem">
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebarFooter">Errevi Automation</div>
    </aside>
  );
}
