import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/mis-recibos',
      name: 'mis-recibos',
      component: () => import('@/views/MisRecibosView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recibos/:id',
      name: 'recibo-detalle',
      component: () => import('@/views/ReciboDetalleView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recibos/buscar',
      name: 'buscar-recibos',
      component: () => import('@/views/BuscarRecibosView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['administrador', 'mesaayuda', 'gerencial']
      }
    },
    {
      path: '/liquidaciones',
      name: 'liquidaciones',
      component: () => import('@/views/LiquidacionesView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['administrador', 'liquidaciones', 'mesaayuda', 'gerencial']
      }
    },
    {
      path: '/liquidaciones/nueva',
      name: 'nueva-liquidacion',
      component: () => import('@/views/NuevaLiquidacionView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['administrador', 'liquidaciones']
      }
    },
    {
      path: '/personal',
      name: 'personal',
      component: () => import('@/views/PersonalView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['administrador', 'mesaayuda', 'liquidaciones', 'gerencial']
      }
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('@/views/UsuariosView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['administrador', 'mesaayuda']
      }
    },
    {
      path: '/usuarios/nuevo',
      name: 'nuevo-usuario',
      component: () => import('@/views/NuevoUsuarioView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['administrador']
      }
    },
    {
      path: '/usuarios/:id',
      name: 'editar-usuario',
      component: () => import('@/views/EditarUsuarioView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['administrador', 'mesaayuda']
      }
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('@/views/PerfilView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Inicializar store si hay token pero no user
  if (authStore.token && !authStore.user) {
    await authStore.initialize()
  }

  // Rutas de invitado (login)
  if (to.meta.guest && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  // Rutas protegidas
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  // Verificar roles
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    if (!authStore.hasRole(requiredRoles)) {
      return next('/dashboard')
    }
  }

  next()
})

export default router
