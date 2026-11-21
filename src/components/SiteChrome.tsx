"use client";

import { DesignProvider } from "@/context/DesignContext";
import { AgentProvider } from "@/context/AgentContext";
import { PresetProvider } from "@/context/PresetContext";

interface SiteChromeProps {
  children: React.ReactNode;
  /** Passed in from the layout so they can stay server components. */
  navbar: React.ReactNode;
  footer: React.ReactNode;
  extras?: React.ReactNode;
}

/**
 * Wraps every page in the site's providers, navbar and footer. The design
 * provider sits outermost, so every page and the chrome around it know which
 * design is showing.
 */
export default function SiteChrome({
  children,
  navbar,
  footer,
  extras,
}: SiteChromeProps) {
  return (
    <DesignProvider>
      <AgentProvider>
        <PresetProvider>
          {navbar}
          {children}
          {footer}
          {extras}
        </PresetProvider>
      </AgentProvider>
    </DesignProvider>
  );
}
