import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)
export default new Vuex.Store({
  state: {
    userInfo: ''
  },
  mutations: {
    setLoginInfo: (state, data) => {
      state.userInfo = data
    },
  },
  actions: {
    commitUserInfo:({commit},data)=>commit('setLoginInfo',data)

  },
  modules: {
  }
})
