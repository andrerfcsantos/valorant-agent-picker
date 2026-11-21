"use client";

import { useDesign } from "@/context/DesignContext";
import PresetsContent from "@/components/PresetsContent";
import PresetsRefresh from "@/components/refresh/PresetsRefresh";

/** The manage presets page, in whichever design the visitor is on. */
export default function PresetsPage() {
  const { design, ready } = useDesign();
  // The saved design is only known after mount. Rendering the default first
  // would show one design and then swap it for the other.
  if (!ready) return null;
  return design === "refresh" ? <PresetsRefresh /> : <PresetsContent />;
}
