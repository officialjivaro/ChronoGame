import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import ResultsView from '../views/ResultsView.vue'
const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/game', name: 'Game', component: GameView },
  { path: '/results', name: 'Results', component: ResultsView }
]
export default createRouter({
  history: createWebHistory(),
  routes
})
