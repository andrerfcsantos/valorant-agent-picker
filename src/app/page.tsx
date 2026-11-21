import type { Metadata } from "next";
import PickerPage from "@/components/PickerPage";

export const metadata: Metadata = {
  title: { absolute: "Valorant Random Agent Picker" },
  description:
    "Pick a random Valorant agent to play. Select the agents and roles you want and get a random one from your selection. Fast, simple, and free.",
  alternates: { canonical: "https://www.valorantpicker.com/" },
};

export default function Page() {
  return <PickerPage />;
}
