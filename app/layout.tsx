import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Source_Serif_4 } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const ui = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
// Headings use a serif with some weight, so the product reads like a law firm's, not a template.
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", axes: ["opsz"] });
// Only the notice sheet uses a serif, so it reads like a real letter.
const paper = Source_Serif_4({ subsets: ["latin"], variable: "--font-paper", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://claimatic.vercel.app"),
  title: { default: "Claimatic: AI-drafted, advocate-signed legal notices", template: "%s · Claimatic" },
  description: "Claimatic checks whether the Consumer Protection Act, 2019 covers your complaint, drafts a legal notice, and sends it to an advocate who reviews and signs it.",
  openGraph: {
    type: "website",
    siteName: "Claimatic",
    title: "Claimatic: AI-drafted, advocate-signed legal notices",
    description: "Check whether the Consumer Protection Act, 2019 covers your complaint. An advocate reviews and signs the notice.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${display.variable} ${paper.variable}`}>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
