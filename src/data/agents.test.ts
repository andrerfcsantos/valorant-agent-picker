import { describe, expect, test } from "vite-plus/test";

import { SHARE_AGENT_ORDER } from "@/lib/share/agentOrder";
import { AGENTS, getAllAgents } from "./agents";
import { spritePositions } from "./spriteMap";

/**
 * Snapshot of the share index space as first published. Share links encode agent
 * indices against it, so entries may only be APPENDED — never reordered or
 * removed. Add new agents to the end of SHARE_AGENT_ORDER and leave this alone.
 */
const FROZEN_SHARE_ORDER_PREFIX = [
  "breach",
  "brimstone",
  "cypher",
  "jett",
  "omen",
  "phoenix",
  "sage",
  "sova",
  "viper",
  "raze",
  "reyna",
  "killjoy",
  "skye",
  "yoru",
  "astra",
  "kayo",
  "chamber",
  "neon",
  "fade",
  "harbor",
  "gekko",
  "deadlock",
  "iso",
  "clove",
  "vyse",
  "tejo",
  "waylay",
  "veto",
  "miks",
];

describe("agent data", () => {
  test("keys the record by the agent's own key", () => {
    for (const [key, agent] of Object.entries(AGENTS)) {
      expect(agent.key).toBe(key);
    }
  });

  test("has a sprite position for every agent", () => {
    for (const agent of getAllAgents()) {
      expect(spritePositions[agent.key]).toBeDefined();
    }
  });
});

describe("share agent order", () => {
  test("keeps the published index space unchanged", () => {
    expect(
      SHARE_AGENT_ORDER.slice(0, FROZEN_SHARE_ORDER_PREFIX.length),
    ).toEqual(FROZEN_SHARE_ORDER_PREFIX);
  });

  test("has no duplicate entries", () => {
    expect(new Set(SHARE_AGENT_ORDER).size).toBe(SHARE_AGENT_ORDER.length);
  });

  test("covers every agent, so any agent can be shared", () => {
    const shareable = new Set(SHARE_AGENT_ORDER);
    for (const key of Object.keys(AGENTS)) {
      expect(shareable.has(key)).toBe(true);
    }
  });

  test("stays within the addressable index range", () => {
    // 255 is reserved as the "no agent" marker.
    expect(SHARE_AGENT_ORDER.length).toBeLessThanOrEqual(255);
  });
});
