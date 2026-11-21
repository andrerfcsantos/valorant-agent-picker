"use client";

import { type ComponentProps, useEffect, useId, useRef, useState } from "react";
import styles from "./TipButton.module.css";

interface TipButtonProps extends ComponentProps<"button"> {
  /** A sentence on what the button does, shown on hover and keyboard focus. */
  tip: string | null;
  /**
   * Set when the tip only repeats the button's own name, as the tip of an
   * icon does. It is then left out of what a screen reader is told, which
   * would otherwise be the same words twice.
   */
  tipIsName?: boolean;
}

/** How close to the window's edge a tip may come, in pixels. */
const EDGE = 8;

/**
 * A button with a tooltip, for controls too small to say what they do.
 *
 * The tip shows on hover and on keyboard focus, stays while the pointer is on
 * it, and Escape puts it away, so it never sits over something the visitor
 * wants to read. It is centred under the button, or as near to that as the
 * window's edges allow. The button still needs its own short name
 * (`aria-label` when it is only an icon); the tip adds to that and is read
 * out as its description.
 */
export default function TipButton({
  tip,
  tipIsName = false,
  onKeyDown,
  ...props
}: TipButtonProps) {
  const id = useId();
  const tipRef = useRef<HTMLSpanElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Escape first puts away a tip that is showing, and only that: the sheet
  // the button is in stays open until the next Escape. One that is not
  // showing lets Escape do whatever else it does.
  const dismiss = (event: { preventDefault: () => void }) => {
    const node = tipRef.current;
    const style = node && getComputedStyle(node);
    if (style && style.visibility === "visible" && style.display !== "none") {
      event.preventDefault();
    }
    setDismissed(true);
  };

  // A tip shown by the pointer is put away by Escape wherever focus is, so
  // it can be got out of the way without moving the pointer.
  useEffect(() => {
    if (!hovered || !tip) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss(event);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hovered, tip]);

  // A tip that would cross an edge of the window is moved back inside it.
  // Measured on the next frame, once the tip has its size: focus can arrive
  // while what the button opened still covers the tip, as it does when
  // Escape closes a popover and hands focus back to its button.
  const place = () => {
    requestAnimationFrame(() => {
      const node = tipRef.current;
      if (!node) return;
      node.style.setProperty("--tip-shift", "0px");
      const { left, right, width } = node.getBoundingClientRect();
      if (width <= 1) return;
      const max = document.documentElement.clientWidth - EDGE;
      const shift = right > max ? max - right : left < EDGE ? EDGE - left : 0;
      node.style.setProperty("--tip-shift", `${Math.round(shift)}px`);
    });
  };

  return (
    <span
      className={styles.anchor}
      data-dismissed={dismissed || undefined}
      onPointerEnter={() => {
        setHovered(true);
        place();
      }}
      onFocus={place}
      // Put away by Escape, a tip stays away until both the pointer and
      // focus have left the button, so neither brings it straight back.
      onPointerLeave={(event) => {
        setHovered(false);
        if (!event.currentTarget.contains(document.activeElement)) {
          setDismissed(false);
        }
      }}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (!hovered && !(next && event.currentTarget.contains(next))) {
          setDismissed(false);
        }
      }}
    >
      <button
        type="button"
        {...props}
        aria-describedby={tip && !tipIsName ? id : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape") dismiss(event);
          onKeyDown?.(event);
        }}
      />
      {tip && (
        <span
          ref={tipRef}
          id={id}
          role="tooltip"
          aria-hidden={tipIsName || undefined}
          className={styles.tip}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
