import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jasmin Médical Store — Parapharmacie & matériel médical",
  description:
    "Parapharmacie & matériel médical sélectionné avec amour à Nabeul. Cosmétique, orthopédie, diabète, tension — pour votre bien-être au quotidien.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
