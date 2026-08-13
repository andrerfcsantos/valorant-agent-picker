import { describe, expect, test } from "vite-plus/test";

import { AGENTS, ROLES, getAgentsByRole } from "@/data/agents";
import { buildDefaultPresets } from "./defaults";
import { SHORTCUT_COUNT, shortcutForIndex } from "./types";

describe("default presets", () => {
  test("cuts across the roles, since a whole role is already one click away", () => {
    const wholeRoles = ROLES.map((role) =>
      getAgentsByRole(role.key)
        .map((agent) => agent.key)
        .sort()
        .join(","),
    );
    for (const preset of buildDefaultPresets()) {
      expect(wholeRoles).not.toContain([...preset.agents].sort().join(","));
    }
  });

  test("names only agents that exist, so no preset is silently short", () => {
    for (const preset of buildDefaultPresets()) {
      for (const key of preset.agents) {
        expect(AGENTS[key]).toBeDefined();
      }
    }
  });

  test("keeps ids unique, so restoring them cannot duplicate a preset", () => {
    const ids = buildDefaultPresets().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("lists each agent at most once per preset", () => {
    for (const preset of buildDefaultPresets()) {
      expect(new Set(preset.agents).size).toBe(preset.agents.length);
    }
  });

  test("has no empty preset", () => {
    for (const preset of buildDefaultPresets()) {
      expect(preset.agents.length).toBeGreaterThan(0);
    }
  });

  test("fits inside the number row, so every default has a shortcut", () => {
    expect(buildDefaultPresets().length).toBeLessThanOrEqual(SHORTCUT_COUNT);
  });
});

describe("shortcutForIndex", () => {
  test("numbers the first ten presets 1-9 and then 0", () => {
    const keys = Array.from({ length: SHORTCUT_COUNT }, (_, i) =>
      shortcutForIndex(i),
    );
    expect(keys).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
  });

  test("gives nothing to presets outside the shortcut range", () => {
    expect(shortcutForIndex(SHORTCUT_COUNT)).toBeNull();
    expect(shortcutForIndex(-1)).toBeNull();
  });
});
