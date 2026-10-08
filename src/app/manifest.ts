import type { MetadataRoute } from "next";

/** Deixa o CarOS instalável: "Adicionar à tela inicial" vira um app de verdade. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CarOS PRO",
    short_name: "CarOS",
    description: "O sistema operacional da sua revenda.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#fafafa",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
