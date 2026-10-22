import type { Metadata, Viewport } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const ui = Geist({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
// Only the notice sheet uses a serif, so it reads like a real letter.
const paper = Source_Serif_4({ subsets: ["latin"], variable: "--font-paper", display: "swap" });

export const metadata: Metadata = {
  title: "Hisaab",
  description: "Your money. Your right. Check whether the Consumer Protection Act, 2019 covers your complaint and get a ready-to-send legal notice.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${paper.variable}`}>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
