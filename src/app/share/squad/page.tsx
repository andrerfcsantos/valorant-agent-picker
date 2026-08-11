import type { Metadata } from "next";
import SharedSquadContent from "@/components/SharedSquadContent";

const title = "Someone randomized a squad for you";
const description =
  "Open the link to reveal the Valorant squad that was randomized for you, then roll again with the same setup.";

export const metadata: Metadata = {
  title: { absolute: `${title} | Valorant Picker` },
  description,
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    url: "https://www.valorantpicker.com/share/squad",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function SharedSquadPage() {
  return <SharedSquadContent />;
}
