import type { Metadata, Viewport } from "next";
import { Allura } from "next/font/google";
import "./globals.css";

const scriptFont = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jasmin-medical-store.com"),
  title: {
    default: "Jasmin Médical Store — Parapharmacie & matériel médical",
    template: "%s — Jasmin Médical Store",
  },
  description:
    "Parapharmacie & matériel médical sélectionné avec amour à Nabeul. Cosmétique, orthopédie, diabète, tension — pour votre bien-être au quotidien.",
  openGraph: {
    type: "website",
    locale: "fr_TN",
    siteName: "Jasmin Médical Store",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#1F6F6D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={scriptFont.variable}>
      <body>{children}</body>
    </html>
  );
}
