import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alpha Convites — Lista de Adesão",
  description:
    "Convites de formatura premium. Cadastre sua turma e receba propostas personalizadas da Alpha Convites.",
  openGraph: {
    title: "Alpha Convites — Lista de Adesão",
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
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-bg text-text-primary">
        {children}
      </body>
    </html>
  );
}
