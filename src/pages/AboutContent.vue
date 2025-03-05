<template>
  <div class="about-main-container col-5">
    <h2 class="title disclaimer-header">About this site</h2>

    <p class="paragraph-text">
      This site allows you to get a random agent to play from a list of agents
      you selected. You can use this to get a new agent to play when you are not
      sure which one to chose, or to get a random new one to try/improve.
    </p>

    <h2 class="title">Discord</h2>

    <p class="paragraph-text">
      Join the Discord server:
      <a href="https://discord.gg/2yb3ZPzjve">https://discord.gg/2yb3ZPzjve</a>
    </p>

    <h2 class="title">Donate</h2>

    <p class="paragraph-text">
      If you like this project, consider making a donation by clicking on the
      image below (or
      <a href="https://www.buymeacoffee.com/heropickers" target="_blank">here</a
      >)! You can choose to make a one-time donation or become a member and
      donate monthly/annually. The money will be used to cover the costs of
      keeping the site up, free for everyone and with no ads.
    </p>

    <a
      class="bmc"
      href="https://www.buymeacoffee.com/heropickers"
      target="_blank"
    >
      <img
        class="bmc-logo img-fluid"
        src="../../public/assets/imgs/navbar/bmc.svg"
      />
    </a>

    <h2 class="title disclaimer-header">Contact me</h2>

    <p class="paragraph-text">
      If you have feedback, suggestions, comments about the site or you just
      want to say something to me, reach out at heropickers [at] gmail [dot]
      com. You can also contact me via the
      <a href="https://discord.gg/2yb3ZPzjve">Discord server</a>.
    </p>

    <h2 class="title disclaimer-header">Disclaimer</h2>

    <p class="paragraph-text">
      This is a fan-site for Valorant and it is not affiliated with Riot Games.
      All rights belong to their respective owners. Below are the relevant
      copyright notice:
    </p>

    <p class="paragraph-text copyright-notice">
      Valorant Agent Picker was created under Riot Games' "Legal Jibber Jabber"
      policy using assets owned by Riot Games. Riot Games does not endorse or
      sponsor this project.
    </p>
  </div>
</template>

<script>
import { sendEvent } from "../services/events";

export default {
  name: "AboutContent",
  created() {
    sendEvent("Page", "Visit", "About");
  },
};
</script>

<style scoped>
.about-main-container {
  color: white;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  padding-left: 20%;
  padding-right: 20%;
  padding-top: 2em;
  margin-bottom: 3em;
  height: 80vh;
}

p,
.copyright-notice-header {
  text-align: start;
}

a {
  font-family: inherit;
}

/* unvisited link */
a:link {
  color: orange;
}

/* visited link */
a:visited {
  color: orangered;
}

/* mouse over link */
a:hover {
  color: orangered;
}

/* selected link */
a:active {
  color: orange;
}

.about-main-container {
  color: white;
  display: flex;
  flex-direction: column;
  text-align: start;
}

@media (max-width: 1000px) {
  .about-main-container {
    max-width: 100%;
  }
}

.title {
  color: rgb(248, 158, 74);
  text-decoration: underline;
}

.paragraph-text {
  font-size: 1.1em;
}

.copyright-notice {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 0.9em;
}

form {
  text-align: center;
}

img {
  width: 20em;
}

.bmc {
  text-align: center;
}
</style>
