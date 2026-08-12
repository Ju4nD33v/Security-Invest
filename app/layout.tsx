import type { Metadata } from "next";
import "./globals.css";
import "./app.css";
import "./responsive.css";
import "./insights.css";
import "./landing-extras.css";

export const metadata: Metadata = { title: "SYT — SecurityInvest", description: "Investimentos com clareza e segurança." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
