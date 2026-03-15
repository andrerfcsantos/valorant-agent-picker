import type { Metadata } from "next";
import SquadContent from "@/components/SquadContent";

export const metadata: Metadata = {
  title: "Squad Generator",
  description:
    "Generate random Valorant agent assignments for your entire squad. Assign unique agents to each player with one click.",
  alternates: { canonical: "https://www.valorantpicker.com/squad" },
};

export default function SquadPage() {
  return <SquadContent />;
}
