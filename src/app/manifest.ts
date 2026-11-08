import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Valorant Random Agent Picker",
    short_name: "Valorant Picker",
    description:
      "Pick a random Valorant agent to play. Select the agents you want and get a random one from your selection.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1923",
    theme_color: "#ff4655",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      {
        src: "/imgs/logo/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/imgs/logo/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/imgs/logo/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
