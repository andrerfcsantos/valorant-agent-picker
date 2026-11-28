"use client";

import { useDesign } from "@/context/DesignContext";
import { useSquad } from "@/hooks/useSquad";
import ClassicDesignNotice from "@/components/ClassicDesignNotice";
import SquadContent from "@/components/SquadContent";
import SquadRefresh from "@/components/refresh/SquadRefresh";

/**
 * The squad generator, in whichever design the visitor is on.
 *
 * The page's behaviour lives here, above the choice of design, so switching
 * only swaps the view: the squad on screen, the players' selections and a
 * shared setup's undo all carry over.
 */
export default function SquadPage() {
  const { design, ready } = useDesign();
  const squad = useSquad();
  // The saved design and setup are only known after mount. Rendering the
  // defaults first would show one design and then swap it for the other.
  if (!ready || !squad.mounted) return null;
  if (design === "refresh") return <SquadRefresh squad={squad} />;
  return (
    <>
      <ClassicDesignNotice />
      <SquadContent squad={squad} />
    </>
  );
}
