import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  applicationName: "AS Performance",
  title: "AS Performance – Werkstatt-Verwaltung",
  description: "Kunden, Angebote und Rechnungen für die Werkstatt",
  // Als Web-App auf dem Home-Bildschirm im Vollbild starten (ohne Browser-Leisten).
  appleWebApp: {
    capable: true,
    title: "AS Performance",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  // Ältere iOS-Versionen kennen nur die apple-eigene Kennung – zur Sicherheit ergänzt.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${plexMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
