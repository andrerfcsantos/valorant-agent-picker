import type { Metadata } from "next";
import SharedAgentContent from "@/components/SharedAgentContent";

const title = "Someone randomized an agent for you";
const description =
  "Open the link to reveal which Valorant agent was randomized for you, then roll again with the same filters.";

export const metadata: Metadata = {
  title: { absolute: `${title} | Valorant Picker` },
  description,
  // Every visit is a different payload behind the same URL, so there is nothing
  // here worth indexing.
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    url: "https://www.valorantpicker.com/share/agent",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function SharedAgentPage() {
  return <SharedAgentContent />;
}
