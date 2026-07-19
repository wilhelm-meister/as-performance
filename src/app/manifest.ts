import type { MetadataRoute } from "next";

/**
 * Web-App-Manifest → macht PKWdesk/AS Performance auf dem Handy installierbar.
 * `display: "standalone"` sorgt dafür, dass die App vom Home-Bildschirm im
 * Vollbild startet – ohne Browser-Leisten (Adresszeile, Zurück/Teilen-Bar).
 * Die Icons werden per Code aus icon.tsx / apple-icon.tsx erzeugt.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AS Performance – Werkstatt",
    short_name: "AS Performance",
    description:
      "Kunden, Fahrzeuge, Angebote und Rechnungen für die Werkstatt",
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfbfd",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
