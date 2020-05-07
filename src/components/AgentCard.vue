<template>
  <div
    class="agent-card"
    :class="{ selected: agentSelectedState }"
    @click="toggleAgentAction"
  >
    <img
      class="agent-image"
      :alt="agent.name + ' icon'"
      :src="`${publicPath}assets/imgs/agents/icons/` + agent.key + '.png'"
    />
    <div class="agent-name" :class="{ selected: agentSelectedState }">
      {{ agent.name }}
    </div>
  </div>
</template>

<script>
import {
  toggleAgent,
  saveSelectedAgentsToLS,
} from "../services/agents_service";
import { sendEvent } from "../services/events";

export default {
  name: "AgentCard",
  props: {
    agent: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      publicPath: process.env.BASE_URL,
    };
  },
  computed: {
    agentSelectedState() {
      return this.$store.state.agents.agentList[this.agent.key].selected;
    },
  },
  methods: {
    toggleAgentAction: function () {
      toggleAgent(this.agent.key);
      saveSelectedAgentsToLS();
      let event = this.agentSelectedState ? "SelectAgent" : "UnselectAgent";
      sendEvent("Filter", event, this.agent.name);
    },
  },
};
</script>

<style scoped>
.agent-card {
  display: inline-flex;
  margin: 0.25em;
  width: 14.5em;
  background-color: #0192c7;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
}

.agent-card.selected {
  background-color: green;
}

.agent-card:hover {
  box-shadow: 0px 0px 0.5em #21c0fa;
}

.agent-card:active {
  transform: translate(1px, 1px);
}

.hidden {
  visibility: hidden;
}

.checkmark {
  font-size: 1.5em;
  padding: 0 0.1em;
  color: lawngreen;
}
/*  ------- */

.agent-image {
  height: 3em;
  vertical-align: bottom;
  background-color: #343a40;
}

/*  ------- */

.agent-name {
  min-height: 100%;
  padding: 0 0 0 0.2em;
  font-size: 2em;
  white-space: nowrap;
  outline: none;
}

/*  ------- */

@media (max-width: 1375px) {
  .agent-card {
    width: 13em;
  }
  .agent-name {
    font-size: 1.75em;
  }
  .agent-image {
    height: 2.75em;
  }
}

@media (max-width: 1090px) {
  .agent-card {
    width: 13em;
  }
  .agent-name {
    font-size: 1.75em;
  }
  .agent-image {
    height: 2.75em;
  }
}

@media (max-width: 710px) {
  .agent-image {
    height: 2.75em;
  }
}

@media (max-width: 420px) {
  .agent-card {
    width: 100%;
  }
}

@media (max-width: 320px) {
  .agent-card {
    width: 100%;
  }
  .agent-name {
    font-size: 1.5em;
  }
}
</style>
