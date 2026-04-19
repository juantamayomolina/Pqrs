import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/radicar',
    name: 'Radicar',
    component: () => import('../views/CreatePqrsView.vue')
  },
  {
    path: '/consultar',
    name: 'Consultar',
    component: () => import('../views/TrackPqrsView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
