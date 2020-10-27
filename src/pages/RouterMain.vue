<template>
  <div>
    <Navbar />
    <router-view />
    <footer>
      <div class="container text-center">
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
}

footer {
  color: grey;
}
</style>
