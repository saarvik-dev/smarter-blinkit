import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import SmoothScroll from "@/components/SmoothScroll";
import FloatingAIBubble from "@/components/FloatingAIBubble";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "SmarterBlinkit — Market Ledger",
  description: "AI-powered local marketplace. Shop smarter with intent search, recipe agents, and optimized local delivery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}>
      <body>
        <AppProvider>
          <SmoothScroll>
            {children}
            <FloatingAIBubble />
          </SmoothScroll>
        </AppProvider>
      </body>
    </html>
  );
}
