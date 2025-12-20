<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConstantsStore } from '@/stores/constants'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const constantsStore = useConstantsStore()

const menuOpen = ref(false)
const userMenuOpen = ref(false)

const menuItems = computed(() => {
  const items = [
    {
      name: 'Inicio',
      to: '/dashboard',
      show: true
    },
    {
      name: 'Mis Recibos',
      to: '/mis-recibos',
      show: true
    },
    {
      name: 'Buscar Recibos',
      to: '/recibos/buscar',
      show: authStore.canSearchRecibos
    },
    {
      name: 'Liquidaciones',
      to: '/liquidaciones',
      show: authStore.canViewLiquidaciones
    },
    {
      name: 'Personal',
      to: '/personal',
      show: authStore.canViewPersonal
    },
    {
      name: 'Usuarios',
      to: '/usuarios',
      show: authStore.isMesaAyuda
    }
  ]
  return items.filter(item => item.show)
})

const roleName = computed(() => {
  if (!authStore.user?.role) return ''
  return constantsStore.getRoleName(authStore.user.role)
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    userMenuOpen.value = false
  }
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function closeMenus() {
  menuOpen.value = false
  userMenuOpen.value = false
}

onMounted(() => {
  constantsStore.fetchConstants()
})
</script>

<template>
  <div class="app-layout">
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <button class="menu-toggle" @click="toggleMenu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <router-link to="/dashboard" class="logo">
            Sistema de Recibos Web
          </router-link>
        </div>

        <nav class="nav-desktop">
          <router-link
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActive(item.to) }"
          >
            {{ item.name }}
          </router-link>
        </nav>

        <div class="header-right">
          <div class="user-menu" @click="toggleUserMenu">
            <div class="user-avatar">
              {{ (authStore.user?.nombre || authStore.user?.username || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="user-info-desktop">
              <span class="user-name">{{ authStore.user?.nombre || authStore.user?.username }}</span>
              <span class="user-role">{{ roleName }}</span>
            </div>
            <span class="dropdown-arrow">&#9662;</span>

            <div v-if="userMenuOpen" class="dropdown-menu">
              <router-link to="/perfil" class="dropdown-item" @click="closeMenus">
                Mi Perfil
              </router-link>
              <button class="dropdown-item" @click="handleLogout">
                Cerrar Sesion
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <nav v-if="menuOpen" class="nav-mobile">
      <router-link
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        :class="{ active: isActive(item.to) }"
        @click="closeMenus"
      >
        {{ item.name }}
      </router-link>
    </nav>

    <main class="main">
      <slot></slot>
    </main>
  </div>

  <div v-if="menuOpen || userMenuOpen" class="overlay" @click="closeMenus"></div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: #fff url('/logo_provincia.png') no-repeat left center;
  background-size: contain;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.menu-toggle span {
  display: block;
  width: 20px;
  height: 2px;
  background: #1a1a2e;
}

@media (max-width: 900px) {
  .menu-toggle {
    display: flex;
  }
}

.logo {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1a1a2e;
  text-decoration: none;
}

@media (max-width: 600px) {
  .logo {
    font-size: 0.95rem;
  }
}

.nav-desktop {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 900px) {
  .nav-desktop {
    display: none;
  }
}

.nav-link {
  padding: 0.5rem 0.875rem;
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #1a1a2e;
  background: #f3f4f6;
}

.nav-link.active {
  color: #00AEC3;
  background: #E5F9FB;
}

.header-right {
  position: relative;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.375rem 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-menu:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #00AEC3 0%, #009AAD 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-info-desktop {
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  .user-info-desktop {
    display: none;
  }
}

.user-name {
  font-size: 0.85rem;
  color: #1a1a2e;
  font-weight: 500;
}

.user-role {
  font-size: 0.75rem;
  color: #666;
}

.dropdown-arrow {
  font-size: 0.75rem;
  color: #666;
}

@media (max-width: 600px) {
  .dropdown-arrow {
    display: none;
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  overflow: hidden;
  z-index: 200;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  color: #374151;
  text-decoration: none;
  font-size: 0.9rem;
  border: none;
  background: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.nav-mobile {
  display: none;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 0.5rem;
  flex-direction: column;
}

@media (max-width: 900px) {
  .nav-mobile {
    display: flex;
  }
}

.nav-mobile .nav-link {
  padding: 0.75rem 1rem;
}

.main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 50;
}
</style>
