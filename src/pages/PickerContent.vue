<template>
  <div class="main-container col-12 h-100 m-0 p-0 unselectable">
    <div class="row col-12 m-0 p-0">
      <div class="left-content col-lg-3">
        <h1 class="left-title">You should play</h1>

        <div>
          <input
            id="checkbox-show-portrait"
            v-model="showPortrait"
            type="checkbox"
            name="checkbox-show-portrait"
            :value="true"
          />
          <label
            id="show-portrait-label"
            for="checkbox-show-portrait"
            class="show-portrait-label"
            >Show agent portrait</label
          >
        </div>

        <img
          v-if="showPortrait"
          key="agent-image"
          class="chosen-agent-image img-fluid"
          :src="'assets/imgs/agents/portraits/' + selectedAgent.key + '.png'"
        />

        <transition name="agent-name-transition" mode="out-in">
          <h2
            :key="`agent-name-${selectedAgent.name}-${agentCount}`"
            class="chosen-agent-name"
          >
            {{ selectedAgent.name }}
          </h2>
        </transition>

        <div
          type="button"
          class="random-agent-button btn"
          @click="randomAgentHandler"
        >
          Get Random Agent
        </div>
      </div>

      <div class="right-content col-lg-9">
        <h1 class="right-title">Filter Agents</h1>

        <p class="filter-description">
          Select the agents you wish to play and click in the "Get Random Agent"
          button to get a random agent from the selected ones.
        </p>

        <div class="filter-description selected-agents-info">
          <p
            v-if="numberOfSelectedAgents === 0"
            class="filter-description selected-agents-text"
          >
            You have no agents selected, so all agents are being considered by
            default.
          </p>
          <p
            v-else-if="numberOfSelectedAgents === 1"
            class="filter-description selected-agents-text"
          >
            You have {{ numberOfSelectedAgents }} agent selected.
          </p>
          <p v-else class="filter-description selected-agents-text">
            You have {{ numberOfSelectedAgents }} agents selected.
          </p>
        </div>

        <div class="filter-header">
          <img
            class="role-icon"
            alt="Tank role icon"
            src="assets/imgs/roles/controller.png"
          />
          <h2 class="role-header">Controller</h2>
          <button
            class="all-button select-all-button"
            @click="selectByRole('CONTROLLER')"
          >
            Select All
          </button>
          <button
            class="all-button unselect-all-button"
            @click="unselectByRole('CONTROLLER')"
          >
            Unselect All
          </button>
        </div>

        <AgentCard
          v-for="h in getAgentsByRole('CONTROLLER')"
          :key="h.key"
          :agent="h"
        />

        <div class="filter-header">
          <img
            class="role-icon"
            alt="Damage role icon"
            src="assets/imgs/roles/sentinel.png"
          />
          <h2 class="role-header">Sentinel</h2>
          <button
            class="all-button select-all-button"
            @click="selectByRole('SENTINEL')"
          >
            Select All
          </button>
          <button
            class="all-button unselect-all-button"
            @click="unselectByRole('SENTINEL')"
          >
            Unselect All
          </button>
        </div>

        <AgentCard
          v-for="h in getAgentsByRole('SENTINEL')"
          :key="h.key"
          :agent="h"
        />

        <div class="filter-header">
          <img
            class="role-icon"
            alt="Support role icon"
            src="assets/imgs/roles/initiator.png"
          />
          <h2 class="role-header">Initiator</h2>
          <button
            class="all-button select-all-button"
            @click="selectByRole('INITIATOR')"
          >
            Select All
          </button>
          <button
            class="all-button unselect-all-button"
            @click="unselectByRole('INITIATOR')"
          >
            Unselect All
          </button>
        </div>
        <AgentCard
          v-for="h in getAgentsByRole('INITIATOR')"
          :key="h.key"
          :agent="h"
        />

        <div class="filter-header">
          <img
            class="role-icon"
            alt="Support role icon"
            src="assets/imgs/roles/duelist.png"
          />
          <h2 class="role-header">Duelist</h2>
          <button
            class="all-button select-all-button"
            @click="selectByRole('DUELIST')"
          >
            Select All
          </button>
          <button
            class="all-button unselect-all-button"
            @click="unselectByRole('DUELIST')"
          >
            Unselect All
          </button>
        </div>
        <AgentCard
          v-for="h in getAgentsByRole('DUELIST')"
          :key="h.key"
          :agent="h"
        />
      </div>
    </div>
  </div>
</template>

<script>
import {
  randomAgent,
  getAgentsByRole,
  selectByRole,
  unselectByRole,
  saveSelectedAgentsToLS,
  getSelectedLSAgents,
  getSelected,
} from "../services/agents_service";
import AgentCard from "@/components/AgentCard";
import { sendEvent } from "../services/events";

export default {
  name: "PickerPageContent",
  components: {
    AgentCard,
  },
  data() {
    return {
      selectedAgent: {
        name: "",
        role: "",
        selected: false,
        key: "",
      },
      agentCount: 0,
      showPortrait: true,
    };
  },
  computed: {
    selectedAgents: function () {
      return getSelected().map((h) => h.name);
    },
    numberOfSelectedAgents: function () {
      return this.selectedAgents.length;
    },
  },
  watch: {
    showPortrait: function (newValue) {
      localStorage.setItem("showPortrait", newValue);
    },
  },
  created() {
    getSelectedLSAgents();
    this.selectedAgent = randomAgent();
    let showPortraitLS = localStorage.getItem("showPortrait");

    if (showPortraitLS !== null) {
      this.showPortrait = showPortraitLS === "true";
    } else {
      localStorage.setItem("showPortrait", this.showPortrait);
    }
  },
  methods: {
    randomAgentHandler() {
      this.randomAgent();
      sendEvent("Agent", "GetRandom", this.selectedAgent.name);
    },
    randomAgent: function () {
      this.selectedAgent = randomAgent();
      this.agentCount += 1;
    },
    getAgentsByRole(role) {
      return getAgentsByRole(role);
    },
    selectByRole(role) {
      selectByRole(role);
      saveSelectedAgentsToLS();
      sendEvent("Filter", "SelectRole", role);
    },
    unselectByRole(role) {
      unselectByRole(role);
      saveSelectedAgentsToLS();
      sendEvent("Filter", "UnselectRole", role);
    },
  },
};
</script>

<style scoped>
.main-container {
  overflow-x: hidden;
  color: white;
  display: flex;
  min-height: 87vh;
}

.left-content {
  display: flex;
  flex-direction: column;
  padding: 0 3% 0 3%;
}

.left-title,
.right-title {
  color: white;
  text-decoration: underline;
}

.left-content .chosen-agent-image {
  max-width: 75%;
  margin-left: auto;
  margin-right: auto;
}

.chosen-agent-name {
  margin: 1rem 1rem;
}

.random-agent-button,
.random-agent-button:hover,
.random-agent-button:focus,
.random-agent-button:active {
  font-size: 1.5rem;
  color: white;
  background-color: orangered;
  border-color: orangered;
  -webkit-appearance: none;
}

.right-content {
  display: block;
  text-align: start;
}

.selected-agents-info {
  font-size: 1.5rem;
  color: orange;
  margin: 1rem 0 0 0;
}
.selected-agents-text {
  margin: 0;
  font-color: orange;
}

/** Large breakpoint or smaller */
@media (max-width: 991.98px) {
  .right-content {
    text-align: center;
  }

  .right-title {
    margin-top: 5%;
  }
}

@media (max-width: 400px) {
  .all-button {
    font-size: 0.5rem;
  }

  .role-header {
    font-size: 1em;
  }
}

.filter-description {
  display: block;
  font-size: 1.1rem;
  user-select: text;
  margin: 0;
}

/** Filter header */
.role-icon {
  height: 1.25em;
  margin-right: 0.5em;
}
.role-header {
  margin: 0.5em 0.5em 0.5em 0;
}
.filter-header {
  display: flex;
  flex-direction: row;
  align-items: center;
}

/** Select / Unselect all buttons */
.all-button {
  color: white;
  border: none;
  font-size: 1rem;
  background-color: #0192c7;
  outline: none;
  padding: 0 0.3em;
  margin: 0 0.1em;
  height: min-content;
  vertical-align: text-bottom;
}

.all-button:active {
  transform: translate(1px, 1px);
}

.select-all-button {
  background-color: rgb(51, 150, 31);
}

.unselect-all-button {
  background-color: rgb(231, 117, 9);
}

.all-button:hover {
  cursor: pointer;
}

.random-agent-button {
  margin-bottom: 5%;
}

.agent-name-transition-enter-active {
  transition: all 0.1s ease-out;
}

.agent-name-transition-leave-active {
  transition: all 0.1s ease-in;
}

.agent-name-transition-enter,
.agent-name-transition-leave-to {
  transform: scaleY(0) translateZ(0);
  opacity: 0;
}

.agent-name-transition-enter-to {
  transform: scaleY(1) translateZ(0);
  opacity: 1;
}

.show-portrait-label {
  margin: 0 0 0 1%;
}
</style>
