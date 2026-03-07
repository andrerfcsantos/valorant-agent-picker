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
