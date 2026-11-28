"use client";

import { useDesign } from "@/context/DesignContext";
import { usePicker } from "@/hooks/usePicker";
import ClassicDesignNotice from "@/components/ClassicDesignNotice";
import PickerContent from "@/components/PickerContent";
import PickerRefresh from "@/components/refresh/PickerRefresh";

/**
 * The random agent page, in whichever design the visitor is on.
 *
 * The page's behaviour lives here, above the choice of design, so switching
 * only swaps the view: the agent on screen, the options and a shared link's
 * undo all carry over.
 */
export default function PickerPage() {
  const { design, ready } = useDesign();
  const picker = usePicker();
  // The saved design and options are only known after mount. Rendering the
  // defaults first would show one design and then swap it for the other.
  if (!ready || !picker.mounted) return null;
  if (design === "refresh") return <PickerRefresh picker={picker} />;
  return (
    <>
      <ClassicDesignNotice />
      <PickerContent picker={picker} />
    </>
  );
}
