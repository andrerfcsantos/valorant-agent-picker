interface StoredAgent {
  key: string;
  selected: boolean;
}

export function loadSelectedAgents(): Set<string> {
  try {
    const raw = localStorage.getItem("selectedAgents");
    if (!raw) return new Set();
    const parsed: StoredAgent[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((a) => a.selected).map((a) => a.key),
    );
  } catch {
    return new Set();
  }
}

export function saveSelectedAgents(selected: Set<string>) {
  const data = Array.from(selected).map((key) => ({
    key,
    selected: true,
  }));
  localStorage.setItem("selectedAgents", JSON.stringify(data));
}

export function loadShowPortrait(): boolean {
  try {
    const val = localStorage.getItem("showPortrait");
    if (val === null) return true;
    return val === "true";
  } catch {
    return true;
  }
}

export function saveShowPortrait(show: boolean) {
  localStorage.setItem("showPortrait", String(show));
}

export function loadNonRepeating(): boolean {
  try {
    const val = localStorage.getItem("nonRepeating");
    if (val === null) return false;
    return val === "true";
  } catch {
    return false;
  }
}

export function saveNonRepeating(enabled: boolean) {
  localStorage.setItem("nonRepeating", String(enabled));
}

interface StoredSlotConfig {
  name: string;
  agentFilters: string[];
}

export interface SlotConfig {
  name: string;
  disabledAgents: Set<string>;
}

export function loadSquadSlotConfigs(): SlotConfig[] {
  try {
    const raw = localStorage.getItem("squadSlotConfigs");
    if (!raw) return defaultSlotConfigs();
    const parsed: StoredSlotConfig[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 5) return defaultSlotConfigs();
    return parsed.map((s) => ({
      name: s.name ?? "",
      disabledAgents: new Set(s.agentFilters ?? []),
    }));
  } catch {
    return defaultSlotConfigs();
  }
}

export function saveSquadSlotConfigs(configs: SlotConfig[]) {
  const data: StoredSlotConfig[] = configs.map((c) => ({
    name: c.name,
    agentFilters: Array.from(c.disabledAgents),
  }));
  localStorage.setItem("squadSlotConfigs", JSON.stringify(data));
}

function defaultSlotConfigs(): SlotConfig[] {
  return Array.from({ length: 5 }, () => ({ name: "", disabledAgents: new Set<string>() }));
}

export function loadSquadSize(): number {
  try {
    const val = localStorage.getItem("squadSize");
    const n = val ? parseInt(val, 10) : 5;
    return n >= 1 && n <= 5 ? n : 5;
  } catch {
    return 5;
  }
}

export function saveSquadSize(size: number) {
  localStorage.setItem("squadSize", String(size));
}
