<template>
  <div id="app" class="container-fluid">
    <PickerPage />
  </div>
</template>

<script>
import PickerPage from "./pages/RouterMain";

export default {
  name: "App",
  components: {
    PickerPage,
  },
};
</script>

<style>
#app {
  font-family: "DIN Next LT W04 Medium", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  background-color: #2c3e50;
}

html {
  background-color: #2c3e50;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.unselectable {
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -o-user-select: none;
  user-select: none;
}
</style>
