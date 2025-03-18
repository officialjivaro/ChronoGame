import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import ResultsView from '../views/ResultsView.vue'

const routes = [
  { path: '/',       component: HomeView },
  { path: '/game',   component: GameView },
  { path: '/results', component: ResultsView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
