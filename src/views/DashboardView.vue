<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConstantsStore } from '@/stores/constants'

const authStore = useAuthStore()
const constantsStore = useConstantsStore()

const roleName = computed(() => {
  if (!authStore.user?.role) return 'Usuario'
  return constantsStore.getRoleName(authStore.user.role)
})

const menuItems = computed(() => {
  const items = [
    {
      title: 'Mis Recibos',
      description: 'Ver mis recibos de sueldo',
      icon: 'receipt',
      to: '/mis-recibos',
      show: true
    },
    {
      title: 'Buscar Recibos',
      description: 'Buscar recibos por legajo',
      icon: 'search',
      to: '/recibos/buscar',
      show: authStore.canSearchRecibos
    },
    {
      title: 'Liquidaciones',
      description: 'Gestionar liquidaciones',
      icon: 'document',
      to: '/liquidaciones',
      show: authStore.canViewLiquidaciones
    },
    {
      title: 'Personal',
      description: 'Consultar datos de personal',
      icon: 'users',
      to: '/personal',
      show: authStore.canViewPersonal
    },
    {
      title: 'Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: 'settings',
      to: '/usuarios',
      show: authStore.isMesaAyuda
    }
  ]
  return items.filter(item => item.show)
})
</script>

<template>
  <div class="dashboard">
    <div class="welcome-section">
      <h1>Bienvenido, {{ authStore.user?.nombre || authStore.user?.username }}</h1>
      <p class="role-badge">{{ roleName }}</p>
    </div>

    <div class="quick-actions">
      <h2>Acceso Rapido</h2>
      <div class="actions-grid">
        <router-link
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="action-card"
        >
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </router-link>
      </div>
    </div>

    <div v-if="authStore.user?.legajo" class="user-info">
      <h2>Informacion del Usuario</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Usuario:</span>
          <span class="value">{{ authStore.user.username }}</span>
        </div>
        <div class="info-item">
          <span class="label">Email:</span>
          <span class="value">{{ authStore.user.email }}</span>
        </div>
        <div class="info-item">
          <span class="label">Legajo:</span>
          <span class="value">{{ authStore.user.legajo }}</span>
        </div>
        <div v-if="authStore.user.nombre" class="info-item">
          <span class="label">Nombre:</span>
          <span class="value">{{ authStore.user.nombre }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 2rem;
}

.welcome-section h1 {
  color: #1a1a2e;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.role-badge {
  display: inline-block;
  background: linear-gradient(135deg, #00AEC3 0%, #009AAD 100%);
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.quick-actions {
  margin-bottom: 2rem;
}

.quick-actions h2,
.user-info h2 {
  color: #1a1a2e;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #eee;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.action-card h3 {
  color: #1a1a2e;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.action-card p {
  color: #666;
  font-size: 0.85rem;
  margin: 0;
}

.user-info {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.info-item .label {
  font-weight: 500;
  color: #666;
}

.info-item .value {
  color: #1a1a2e;
}
</style>
