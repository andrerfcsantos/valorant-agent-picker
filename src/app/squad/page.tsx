import type { Metadata } from "next";
import SquadPage from "@/components/SquadPage";

export const metadata: Metadata = {
  title: "Squad Generator",
  description:
    "Generate random Valorant agent assignments for your entire squad. Assign unique agents to each player with one click.",
  alternates: { canonical: "https://www.valorantpicker.com/squad" },
};

export default function Page() {
  return <SquadPage />;
}
