import type { Metadata } from "next";
import PresetsContent from "@/components/PresetsContent";

export const metadata: Metadata = {
  title: { absolute: "Manage Presets | Valorant Agent Picker" },
  description:
    "Rename, reorder and remove the agent filter presets saved on this device.",
  // Presets live in the visitor's own browser, so there is nothing here worth
  // indexing.
  robots: { index: false, follow: true },
};

export default function PresetsPage() {
  return <PresetsContent />;
}
