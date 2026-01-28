import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase'

import Auth from '../views/Auth.vue'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Auth',
    component: Auth,
    meta: { guestOnly: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession()
  const isLoggedIn = !!data.session

  // ❌ Neulogiran ide na protected rutu
  if (to.meta.requiresAuth && !isLoggedIn) {
    return '/'
  }

  // ❌ Ulogiran ide na login/register
  if (to.meta.guestOnly && isLoggedIn) {
    return '/home'
  }
})

export default router
