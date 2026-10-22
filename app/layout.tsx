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
        <footer className="site-footer">
          <div className="site-footer-in">
            <p>
              Hisaab helps you organise and prepare your complaint. It&apos;s general information, not legal advice, and it isn&apos;t a law firm or connected to the government.
              You review everything before you send it, and no outcome is guaranteed.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
