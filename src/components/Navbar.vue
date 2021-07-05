<template>
  <b-navbar toggleable="lg" type="dark" variant="dark">
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-brand to="/">
        <img
          class="ow-logo img-fluid"
          src="assets/imgs/navbar/v-logo-red.png"
        />
        <span class="title-text">Valorant Agent Picker</span>
      </b-navbar-brand>
      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item to="/about">About</b-nav-item>
        <b-nav-item
          href="https://github.com/andrerfcsantos/valorant-agent-picker"
          target="_blank"
        >
          Github
        </b-nav-item>
        <b-nav-item
          href="https://www.buymeacoffee.com/heropickers"
          target="_blank"
        >
          <img class="bmc-logo img-fluid" src="assets/imgs/navbar/bmc.svg" />
        </b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
export default {
  name: "Navbar",
};
</script>

<style scoped>
a,
a:active,
a:focus,
a:hover {
  text-decoration: none !important;
  color: white;
}

b-navbar {
  color: white;
  min-height: 5vh;
}

.navbar-brand {
  display: flex;
}

.navbar-brand span {
  align-self: flex-end;
}

a,
ul,
div,
span {
  align-items: center;
}

.title-text {
  font-size: 1.5rem;
  text-decoration: none;
  font-family: Valorant-Regular, Arial, Helvetica, sans-serif;
}

img {
  max-height: 2em;
}

.ow-logo {
  padding-right: 0.5em;
}
</style>
