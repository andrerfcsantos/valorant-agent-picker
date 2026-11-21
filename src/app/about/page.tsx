import type { Metadata } from "next";
import AboutContent from "@/components/AboutContent";
import AboutRefresh from "@/components/refresh/AboutRefresh";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Valorant Random Agent Picker — a fan-made tool for picking random Valorant agents. Community, donations, and contact info.",
  alternates: { canonical: "https://www.valorantpicker.com/about" },
};

/**
 * A static page of text, so it stays a server component and ships both
 * designs in its HTML. CSS shows the visitor's, which means the page is right
 * before React has loaded and its text is there for anything that reads the
 * HTML without running it.
 */
export default function AboutPage() {
  return (
    <>
      <AboutContent />
      <AboutRefresh />
    </>
  );
}
