import type { Agent } from "@/data/agents";
import { getAllAgents } from "@/data/agents";

export const MAX_SLOTS = 5;

export interface SlotConfig {
  name: string;
  disabledAgents: Set<string>;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function emptySlotConfig(): SlotConfig {
  return { name: "", disabledAgents: new Set<string>() };
}

export function ensureConfigs(
  configs: SlotConfig[],
  count: number = MAX_SLOTS,
): SlotConfig[] {
  const result = [...configs];
  while (result.length < count) {
    result.push(emptySlotConfig());
  }
  return result;
}

export function pickForSlot(
  disabledAgents: Set<string>,
  taken: Set<string>,
): Agent | null {
  const all = getAllAgents();
  let pool = all.filter((a) => !disabledAgents.has(a.key) && !taken.has(a.key));
  if (pool.length === 0) {
    // Fallback: ignore filters, just avoid duplicates
    pool = all.filter((a) => !taken.has(a.key));
  }
  if (pool.length === 0) return null;
  return pickRandom(pool);
}

export function computeSquad(
  configs: SlotConfig[],
  size: number,
): (Agent | null)[] {
  const cfgs = ensureConfigs(configs);
  const result: (Agent | null)[] = [];
  const taken = new Set<string>();
  for (let i = 0; i < size; i++) {
    const agent = pickForSlot(cfgs[i].disabledAgents, taken);
    if (agent) taken.add(agent.key);
    result.push(agent);
  }
  return result;
}

/**
 * Slot filters as *enabled* agent keys, which is what share links carry. A slot
 * with nothing ruled out becomes `null`, so the common case costs no bytes.
 */
export function enabledFromSlotConfigs(
  configs: SlotConfig[],
): (string[] | null)[] {
  const allKeys = getAllAgents().map((a) => a.key);
  return ensureConfigs(configs)
    .slice(0, MAX_SLOTS)
    .map((cfg) =>
      cfg.disabledAgents.size === 0
        ? null
        : allKeys.filter((key) => !cfg.disabledAgents.has(key)),
    );
}

/**
 * Inverse of {@link enabledFromSlotConfigs}. Agents released after the link was
 * created are absent from the enabled list and so come back disabled, which
 * keeps the original filter's intent rather than quietly widening it.
 */
export function slotConfigsFromEnabled(
  slots: (string[] | null)[],
  names: string[],
): SlotConfig[] {
  const allKeys = getAllAgents().map((a) => a.key);
  const configs: SlotConfig[] = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const enabled = slots[i] ?? null;
    const disabledAgents =
      enabled === null
        ? new Set<string>()
        : new Set(allKeys.filter((key) => !enabled.includes(key)));
    configs.push({ name: names[i] ?? "", disabledAgents });
  }
  return configs;
}
