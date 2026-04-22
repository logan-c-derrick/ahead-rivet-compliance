import "./globals.css";
import "@fontsource/material-symbols-outlined";
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

export const metadata: Metadata = {
  title: "Rivet",
  description: "Regulatory compliance management"
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"]
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "600", "700", "800"]
});

const materialSymbolsStyles = `
  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    white-space: nowrap;
    direction: ltr;
    font-feature-settings: 'liga';
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: materialSymbolsStyles }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
