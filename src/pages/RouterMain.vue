<template>
  <div>
    <Navbar />
    <router-view />
    <footer>
      <div class="container text-center">
        <p>
          <a
            href="https://vercel.com/?utm_source=hero-pickers&utm_campaign=oss"
          >
            <img
              class="vercel-logo"
              src="assets/imgs/vercel.svg"
              alt="Vercel logo"
            />
          </a>
        </p>
        <p>
          <small>
            This is a fan-site for Valorant and it is not in any way associated
            with Riot Games
          </small>
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import Navbar from "../components/Navbar";

export default {
  name: "PickerPage",
  components: {
    Navbar,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
span,
span a {
  font-family: Arial, Helvetica, sans-serif;
}

p {
  font-size: 1.25em;
  margin: 0;
}

footer {
  color: grey;
}

.vercel-logo {
  width: auto;
  height: 2em;
  margin: 0 0.5em;
}

@media (max-width: 1220px) {
  footer {
    margin-top: 5em;
  }
}
</style>
