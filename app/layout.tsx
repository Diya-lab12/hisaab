import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const ui = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const paper = Source_Serif_4({ subsets: ["latin"], variable: "--font-paper", display: "swap" });

export const metadata: Metadata = {
  title: "Hisaab",
  description: "Check whether the Consumer Protection Act, 2019 covers your complaint and draft your legal notice.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${paper.variable}`}>
      <body>{children}</body>
    </html>
  );
}
