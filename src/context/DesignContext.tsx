"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type DesignSwitchSource,
  registerDesign,
  track,
} from "@/lib/analytics";
import {
  DEFAULT_DESIGN,
  type Design,
  type DesignChoice,
  readDesignChoice,
  storeDesign,
} from "@/lib/design";

interface DesignContextValue {
  design: Design;
  /** True when the visitor picked this design rather than getting the default. */
  chosen: boolean;
  /**
   * False until the saved choice has been read. Pages that differ between
   * designs wait for it, so nobody watches one design swap for the other.
   */
  ready: boolean;
  /** Switches design, remembers it, and records where the switch came from. */
  setDesign: (design: Design, source: DesignSwitchSource) => void;
}

const DesignContext = createContext<DesignContextValue | null>(null);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<DesignChoice>({
    design: DEFAULT_DESIGN,
    chosen: false,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect -- the saved design is in localStorage, read after mount
    setChoice(readDesignChoice());
    setReady(true);
  }, []);

  const setDesign = useCallback(
    (design: Design, source: DesignSwitchSource) => {
      if (design === choice.design) return;
      storeDesign(design);
      // The navbar, footer and page background follow this attribute in CSS,
      // which is what lets them be right before React has loaded.
      document.documentElement.dataset.design = design;
      setChoice({ design, chosen: true });
      // Registered first, so the switch event itself counts under the design
      // the visitor moved to.
      registerDesign(design, "chosen");
      track("design_switched", { from: choice.design, to: design, source });
      // The two designs lay the page out differently, so the old scroll
      // position points at nothing in particular.
      window.scrollTo(0, 0);
    },
    [choice.design],
  );

  const value = useMemo(
    () => ({
      design: choice.design,
      chosen: choice.chosen,
      ready,
      setDesign,
    }),
    [choice, ready, setDesign],
  );

  return (
    <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (!context) throw new Error("useDesign must be used within DesignProvider");
  return context;
}
