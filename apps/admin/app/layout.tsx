import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jasmin — Espace équipe",
  description: "CRM interne Jasmin Médical Store",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
