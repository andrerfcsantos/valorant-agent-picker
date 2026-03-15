import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Valorant Random Agent Picker — a fan-made tool for picking random Valorant agents. Community, donations, and contact info.",
  alternates: { canonical: "https://www.valorantpicker.com/about" },
};

export default function AboutPage() {
  return <AboutContent />;
}
