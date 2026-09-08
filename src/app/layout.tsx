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
  authors: [{ name: "Andres", url: "https://andresgp.dev" }],
  creator: "Andres",
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
