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
@font-face {
  font-family: "Valorant-Regular";
  src: url("../public/assets/fonts/Valorant/valorant-regular-webfont.woff2")
      format("woff2"),
    url("../public/assets/fonts/Valorant/valorant-regular-webfont.woff")
      format("woff"),
    url("../public/assets/fonts/Valorant/valorant-regular-webfont.ttf")
      format("truetype"),
    url("../public/assets/fonts/Valorant/valorant-regular-webfont.svg#Valorant-Regular")
      format("svg");
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: "DIN Next LT W04 Medium";
  src: url("../public/assets/fonts/DINNext/dinnext.eot"); /* IE9*/
  src: url("../public/assets/fonts/DINNext/dinnext.eot?#iefix")
      format("embedded-opentype"),
    /* IE6-IE8 */ url("../public/assets/fonts/DINNext/dinnext.woff2")
      format("woff2"),
    /* chrome、firefox */ url("../public/assets/fonts/DINNext/dinnext.woff")
      format("woff"),
    /* chrome、firefox */ url("../public/assets/fonts/DINNext/dinnext.ttf")
      format("truetype"),
    /* chrome、firefox、opera、Safari, Android, iOS 4.2+*/
      url("../public/assets/fonts/DINNext/dinnext.svg#DIN Next LT W04 Medium")
      format("svg"); /* iOS 4.1- */
}

@font-face {
  font-family: "Tungsten-Bold";
  src: url("../public/assets/fonts/Tungsten-Bold/tugsten-bold.eot"); /* IE9*/
  src: url("../public/assets/fonts/Tungsten-Bold/tugsten-bold.eot?#iefix")
      format("embedded-opentype"),
    /* IE6-IE8 */ url("../public/assets/fonts/Tungsten-Bold/tugsten-bold.woff2")
      format("woff2"),
    /* chrome、firefox */
      url("../public/assets/fonts/Tungsten-Bold/tugsten-bold.woff")
      format("woff"),
    /* chrome、firefox */
      url("../public/assets/fonts/Tungsten-Bold/tugsten-bold.ttf")
      format("truetype"),
    /* chrome、firefox、opera、Safari, Android, iOS 4.2+*/
      url("../public/assets/fonts/Tungsten-Bold/tugsten-bold.svg#Tungsten-Bold")
      format("svg"); /* iOS 4.1- */
}

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
