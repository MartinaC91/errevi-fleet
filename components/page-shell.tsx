import { Sidebar } from "./sidebar";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="appShell">
      <Sidebar />
      <main className="mainContent">
        <header className="topbar">
          <div>
            <p className="eyebrow">Gestione mezzi aziendali</p>
            <h1>Errevi Fleet</h1>
          </div>
          <div className="userBadge">MC</div>
        </header>
        {children}
      </main>
    </div>
  );
}
