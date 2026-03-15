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
    icons: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }],
  };
}
