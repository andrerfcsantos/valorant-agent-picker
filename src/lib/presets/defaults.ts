import { SavedPreset } from "./types";

/**
 * Built-in presets get stable ids so restoring the defaults can tell which of
 * them are already in the list instead of adding a second copy.
 */
export const DEFAULT_PRESET_ID_PREFIX = "default:";

const defaultId = (suffix: string) => `${DEFAULT_PRESET_ID_PREFIX}${suffix}`;

/**
 * The playstyle pools. Each one cuts across the roles, which is the whole point
 * of them: a plain role selection is already one click away on the picker, from
 * the "Just This Role" button beside each role heading.
 *
 * A new agent does not join any of these until it is added here on purpose —
 * an agent nobody has classified yet is better left out of a pool than guessed
 * into one.
 */
const PLAYSTYLE_PRESETS: { id: string; name: string; agents: string[] }[] = [
  {
    // The five every new account already owns, one per role plus a second
    // Duelist, so this pool is the one a brand-new player can act on.
    id: "starter",
    name: "Starter Agents",
    agents: ["brimstone", "jett", "phoenix", "sage", "sova"],
  },
  {
    // Point-and-click utility, no lineups to memorise, and value for the team
    // even while the aim is still rough.
    id: "beginner",
    name: "Beginner Friendly",
    agents: [
      "brimstone",
      "sage",
      "phoenix",
      "killjoy",
      "gekko",
      "reyna",
      "clove",
    ],
  },
  {
    // The other end of it: map-wide lineups, satchel and dash mechanics, and
    // kits that ask for a team to play around them.
    id: "high-skill",
    name: "High Skill Ceiling",
    agents: [
      "jett",
      "raze",
      "yoru",
      "neon",
      "sova",
      "viper",
      "astra",
      "harbor",
      "chamber",
    ],
  },
  {
    // Anything that takes an enemy's eyes away, flashes and nearsights alike.
    id: "flashes",
    name: "Flashes & Blinds",
    agents: [
      "breach",
      "kayo",
      "skye",
      "phoenix",
      "yoru",
      "reyna",
      "gekko",
      "fade",
      "omen",
    ],
  },
  {
    // Reveals, scans, cameras and trips: the agents who answer "where are they".
    id: "recon",
    name: "Recon & Intel",
    agents: ["sova", "fade", "skye", "gekko", "tejo", "cypher", "killjoy"],
  },
  {
    // Heals, resurrects and buffs — utility spent on the team rather than the map.
    id: "support",
    name: "Team Support",
    agents: ["sage", "skye", "clove", "miks", "brimstone"],
  },
];

/**
 * The presets every visitor starts with. They are ordinary presets once seeded
 * — renaming, editing, reordering and deleting them all work like any other.
 */
export function buildDefaultPresets(): SavedPreset[] {
  return PLAYSTYLE_PRESETS.map((preset) => ({
    id: defaultId(preset.id),
    name: preset.name,
    agents: [...preset.agents],
  }));
}
