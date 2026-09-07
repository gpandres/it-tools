import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tools.andresgp.dev"),
  title: {
    default: "IT Tools | andresgp.dev",
    template: "%s | IT Tools",
  },
  description: "A comprehensive, privacy-first online toolbox for developers, sysadmins, and security researchers. 100% client-side execution.",
  keywords: ["developer tools", "sysadmin tools", "cybersecurity", "blue team", "pcap analyzer", "log parser", "subnet calculator", "jwt decoder", "hash generator", "regex tester", "offline tools"],
  authors: [{ name: "AndresGP", url: "https://andresgp.dev" }],
  creator: "AndresGP",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tools.andresgp.dev",
    title: "IT Tools | Privacy-First Developer Toolbox",
    description: "Zero-dependency, offline-capable tools for developers and sysadmins. Network calculators, cryptography, encoders, and security parsers.",
    siteName: "IT Tools by AndresGP",
  },
  twitter: {
    card: "summary_large_image",
    title: "IT Tools | Privacy-First Developer Toolbox",
    description: "Zero-dependency, offline-capable tools for developers and sysadmins.",
    creator: "@andresgp", // Replace with real handle if applicable
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { Sidebar } from "@/components/sidebar";

import { CookieBanner } from "@/components/cookie-banner";
import { FavoritesProvider } from "@/components/favorites-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full dark`}>
      <body className="min-h-full flex bg-background text-foreground antialiased selection:bg-[var(--phosphor)] selection:text-black">
        <FavoritesProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {children}
          </div>
          <CookieBanner />
        </FavoritesProvider>
      </body>
    </html>
  );
}
