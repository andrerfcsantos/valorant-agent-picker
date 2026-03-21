export type Role = "CONTROLLER" | "DUELIST" | "INITIATOR" | "SENTINEL";

export interface Agent {
  name: string;
  role: Role;
  key: string;
}

export const AGENTS: Record<string, Agent> = {
  breach: { name: "Breach", role: "INITIATOR", key: "breach" },
  brimstone: { name: "Brimstone", role: "CONTROLLER", key: "brimstone" },
  cypher: { name: "Cypher", role: "SENTINEL", key: "cypher" },
  jett: { name: "Jett", role: "DUELIST", key: "jett" },
  omen: { name: "Omen", role: "CONTROLLER", key: "omen" },
  phoenix: { name: "Phoenix", role: "DUELIST", key: "phoenix" },
  sage: { name: "Sage", role: "SENTINEL", key: "sage" },
  sova: { name: "Sova", role: "INITIATOR", key: "sova" },
  viper: { name: "Viper", role: "CONTROLLER", key: "viper" },
  raze: { name: "Raze", role: "DUELIST", key: "raze" },
  reyna: { name: "Reyna", role: "DUELIST", key: "reyna" },
  killjoy: { name: "Killjoy", role: "SENTINEL", key: "killjoy" },
  skye: { name: "Skye", role: "INITIATOR", key: "skye" },
  yoru: { name: "Yoru", role: "DUELIST", key: "yoru" },
  astra: { name: "Astra", role: "CONTROLLER", key: "astra" },
  kayo: { name: "KAY/O", role: "INITIATOR", key: "kayo" },
  chamber: { name: "Chamber", role: "SENTINEL", key: "chamber" },
  neon: { name: "Neon", role: "DUELIST", key: "neon" },
  fade: { name: "Fade", role: "INITIATOR", key: "fade" },
  harbor: { name: "Harbor", role: "CONTROLLER", key: "harbor" },
  gekko: { name: "Gekko", role: "INITIATOR", key: "gekko" },
  deadlock: { name: "Deadlock", role: "SENTINEL", key: "deadlock" },
  iso: { name: "Iso", role: "DUELIST", key: "iso" },
  clove: { name: "Clove", role: "CONTROLLER", key: "clove" },
  vyse: { name: "Vyse", role: "SENTINEL", key: "vyse" },
  tejo: { name: "Tejo", role: "INITIATOR", key: "tejo" },
  waylay: { name: "Waylay", role: "DUELIST", key: "waylay" },
  veto: { name: "Veto", role: "SENTINEL", key: "veto" },
  miks: { name: "Miks", role: "CONTROLLER", key: "miks" },
};

export const ROLES: { key: Role; label: string; icon: string }[] = [
  { key: "CONTROLLER", label: "Controller", icon: "/imgs/roles/controller.webp" },
  { key: "SENTINEL", label: "Sentinel", icon: "/imgs/roles/sentinel.webp" },
  { key: "INITIATOR", label: "Initiator", icon: "/imgs/roles/initiator.webp" },
  { key: "DUELIST", label: "Duelist", icon: "/imgs/roles/duelist.webp" },
];

export function getAllAgents(): Agent[] {
  return Object.values(AGENTS).sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgentsByRole(role: Role): Agent[] {
  return getAllAgents().filter((agent) => agent.role === role);
}
