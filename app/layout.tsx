import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Errevi Fleet",
  description: "Gestione mezzi Errevi Automation"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
