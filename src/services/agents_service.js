import store from "../store";

export function randomAgent() {
  const selected = store.getters["agents/getSelected"];

  if (selected.length === 0) {
    const all_agents = store.getters["agents/getAgents"];
    return all_agents[Math.floor(Math.random() * all_agents.length)];
  }

  return selected[Math.floor(Math.random() * selected.length)];
}

export function getSelectedLSAgents() {
  let selected_agents = localStorage.getItem("selectedAgents");
  if (selected_agents) {
    selected_agents = JSON.parse(selected_agents);
  }
  if (Array.isArray(selected_agents)) {
    selected_agents.forEach((agent) => {
      store.dispatch("agents/setAgentSelectedStatus", {
        agent_key: agent.key,
        selected: agent.selected,
      });
    });
  }
}

export function saveSelectedAgentsToLS() {
  const selected = store.getters["agents/getSelected"];
  localStorage.setItem("selectedAgents", JSON.stringify(selected));
}

export function getSelected() {
  return store.getters["agents/getSelected"];
}

export function getAgentsByRole(role) {
  return store.getters["agents/getByRole"](role);
}

export function toggleAgent(hero_key) {
  store.dispatch("agents/toggleAgent", hero_key);
}

export function selectByRole(role) {
  store.dispatch(`agents/selectByRole`, role);
}

export function unselectByRole(role) {
  store.dispatch(`agents/unselectByRole`, role);
}
