import { loadNonRepeating, loadShowPortrait } from "@/lib/localStorage";
import { shareUrl } from "@/lib/share/urls";

/**
 * A link that sets up the picker with a preset's agents.
 *
 * Presets store filters only, so the options travel as whatever the visitor is
 * currently using — read from storage, which the picker writes on every toggle.
 */
export function presetShareUrl(agents: string[]): string {
  return shareUrl({
    kind: "picker-preset",
    picker: {
      selected: agents,
      showPortrait: loadShowPortrait(),
      nonRepeating: loadNonRepeating(),
    },
  });
}
