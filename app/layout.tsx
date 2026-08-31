import type { Metadata } from "next";
import { Cinzel, Manrope } from "next/font/google";
import "./globals.css";
import "./app.css";
import "./responsive.css";
import "./insights.css";
import "./landing-extras.css";
import "./interactions.css";
import "./brand-theme.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "Security Invest — Análise e Paper Trading",
  description: "Investimentos com clareza e segurança.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={`${manrope.variable} ${cinzel.variable}`}><body>{children}</body></html>;
}
