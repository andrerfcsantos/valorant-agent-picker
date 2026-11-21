"use client";

import { useDesign } from "@/context/DesignContext";
import { useSharedSquad } from "@/hooks/useSharedSquad";
import SharedSquadContent from "@/components/SharedSquadContent";
import SharedSquadRefresh from "@/components/refresh/SharedSquadRefresh";

/**
 * The page a "Share this squad" link opens, in whichever design the visitor
 * is on. Its behaviour is `useSharedSquad`, called here so that switching
 * design keeps the squad.
 */
export default function SharedSquadPage() {
  const { design, ready } = useDesign();
  const shared = useSharedSquad();
  // The saved design is only known after mount; see PickerPage.
  if (!ready) return null;
  if (design === "refresh") return <SharedSquadRefresh shared={shared} />;
  return <SharedSquadContent shared={shared} />;
}
