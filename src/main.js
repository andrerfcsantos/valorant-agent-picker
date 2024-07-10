import Vue from "vue";
import App from "./App.vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "es6-promise/auto";
import store from "./store";
import VueRouter from "vue-router";
import { routes } from "./router/routes";
import { NavbarPlugin } from "bootstrap-vue";

Vue.config.productionTip = false;

// Vue router
Vue.use(VueRouter);
Vue.use(NavbarPlugin);

const router = new VueRouter({
  routes,
});

new Vue({
  render: (h) => h(App),
  router,
  store,
}).$mount("#app");
