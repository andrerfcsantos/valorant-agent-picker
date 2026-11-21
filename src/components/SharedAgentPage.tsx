"use client";

import { useDesign } from "@/context/DesignContext";
import { useSharedAgent } from "@/hooks/useSharedAgent";
import SharedAgentContent from "@/components/SharedAgentContent";
import SharedAgentRefresh from "@/components/refresh/SharedAgentRefresh";

/**
 * The page a "Share this roll" link opens, in whichever design the visitor is
 * on. Its behaviour is `useSharedAgent`, called here so that switching design
 * keeps the roll.
 */
export default function SharedAgentPage() {
  const { design, ready } = useDesign();
  const shared = useSharedAgent();
  // The saved design is only known after mount; see PickerPage.
  if (!ready) return null;
  if (design === "refresh") return <SharedAgentRefresh shared={shared} />;
  return <SharedAgentContent shared={shared} />;
}
