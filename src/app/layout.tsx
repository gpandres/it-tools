import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
  style: "normal",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tools.andresgp.dev"),
  title: {
    default: "IT Tools | andresgp.dev",
    template: "%s | IT Tools",
  },
  description: "Local-first tools for developers, sysadmins and blue teams. Network calculators, incident workflows and utilities with clear data-flow labels.",
  keywords: ["developer tools", "sysadmin tools", "cybersecurity", "blue team", "pcap analyzer", "log parser", "subnet calculator", "jwt decoder", "hash generator", "regex tester", "offline tools"],
  authors: [{ name: "Andres", url: "https://andresgp.dev" }],
  creator: "Andres",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tools.andresgp.dev",
    title: "IT Tools | Privacy-First Developer Toolbox",
    description: "Local-first network calculators, cryptography, encoders and security tools for developers and sysadmins.",
    siteName: "IT Tools by andresgp.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "IT Tools | Privacy-First Developer Toolbox",
    description: "Local-first tools for developers, sysadmins and blue teams.",
    creator: "@gpandres02", // Replace with real handle if applicable
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
import { NotificationProvider } from "@/components/notification-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full dark`} data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground antialiased selection:bg-[var(--phosphor)] selection:text-black">
        <FavoritesProvider>
          <NotificationProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-black focus:p-4 focus:text-[#00ff9c]">Skip to content</a>
          <Sidebar />
          <div id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-w-0">
            {children}
            <CookieBanner />
          </div>
          </NotificationProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}
