import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import WhatsAppFloat from "@/components/WhatsAppFloat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alpha Convites — Lista de Interesse",
  description:
    "Convites de formatura premium. Cadastre sua turma e receba propostas personalizadas da Alpha Convites.",
  openGraph: {
    title: "Alpha Convites — Lista de Interesse",
    description:
      "Convites de formatura premium. Cadastre sua turma e receba propostas personalizadas.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="bg-bg font-sans text-text-primary">
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
