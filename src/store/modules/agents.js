const state = {
  agentList: {
    breach: {
      name: "Breach",
      role: "INITIATOR",
      selected: false,
      key: "breach",
    },
    brimstone: {
      name: "Brimstone",
      role: "CONTROLLER",
      selected: false,
      key: "brimstone",
    },
    cypher: {
      name: "Cypher",
      role: "SENTINEL",
      selected: false,
      key: "cypher",
    },
    jett: {
      name: "Jett",
      role: "DUELIST",
      selected: false,
      key: "jett",
    },
    omen: {
      name: "Omen",
      role: "CONTROLLER",
      selected: false,
      key: "omen",
    },
    phoenix: {
      name: "Phoenix",
      role: "DUELIST",
      selected: false,
      key: "phoenix",
    },
    sage: {
      name: "Sage",
      role: "SENTINEL",
      selected: false,
      key: "sage",
    },
    sova: {
      name: "Sova",
      role: "INITIATOR",
      selected: false,
      key: "sova",
    },
    viper: {
      name: "Viper",
      role: "CONTROLLER",
      selected: false,
      key: "viper",
    },
    raze: {
      name: "Raze",
      role: "DUELIST",
      selected: false,
      key: "raze",
    },
    reyna: {
      name: "Reyna",
      role: "DUELIST",
      selected: false,
      key: "reyna",
    },
    killjoy: {
      name: "Killjoy",
      role: "SENTINEL",
      selected: false,
      key: "killjoy",
    },
  },
};

function agent_comparator_by_key(agent1, agent2) {
  return agent1.name.localeCompare(agent2.name);
}

const getters = {
  getAgents: (state) => {
    return Object.keys(state.agentList)
      .map((key) => state.agentList[key])
      .sort(agent_comparator_by_key);
  },
  getByRole: (state, getters) => (role) => {
    return getters.getAgents.filter((agent) => agent.role == role);
  },
  getSelected: (state, getters) => {
    return getters.getBySelectedStatus(true);
  },
  getBySelectedStatus: (state) => (selected) => {
    return Object.keys(state.agentList)
      .map((key) => state.agentList[key])
      .filter((agent) => agent.selected == selected)
      .sort(agent_comparator_by_key);
  },
};

// actions
const actions = {
  setAgentSelectedStatus({ commit }, { agent_key, selected }) {
    commit("setAgentSelectStatus", { agent_key, selected });
  },
  toggleAgent({ commit }, agent_key) {
    commit("toggleAgent", agent_key);
  },
  selectByRole({ commit }, role) {
    commit("setStateByRole", { role: role, selectedState: true });
  },
  unselectByRole({ commit }, role) {
    commit("setStateByRole", { role: role, selectedState: false });
  },
};

// mutations
const mutations = {
  setAgentSelectStatus(state, { agent_key, selected }) {
    state.agentList[agent_key].selected = selected;
  },
  toggleAgent(state, agent_key) {
    state.agentList[agent_key].selected = !state.agentList[agent_key].selected;
  },
  setStateByRole(state, { role, selectedState }) {
    for (let agent_key in state.agentList) {
      if (state.agentList[agent_key].role === role) {
        state.agentList[agent_key].selected = selectedState;
      }
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
