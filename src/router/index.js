import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

  const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
    {
      path: '/login',
      name: 'Login',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ '../views/Login.vue')
    }
]

const router = new VueRouter({
  routes
})


const whiteList = ["/login"]
router.beforeEach((to, from, next) => {
  // 是否有token
  let hasToken = window.sessionStorage.getItem("sucToken")
  if (hasToken) {
    if (to.path == "/login") {
      next("/")
    } else {
      next()
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next("/login")
    }
  }
})
router.afterEach(to => {
  window.document.title = "suc-" + to.meta.title
})

export default router
