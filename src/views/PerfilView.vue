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
</script>

<template>
  <div class="perfil">
    <div class="page-header">
      <h1>Mi Perfil</h1>
    </div>

    <div class="perfil-card" v-if="authStore.user">
      <div class="avatar">
        {{ (authStore.user.nombre || authStore.user.username).charAt(0).toUpperCase() }}
      </div>

      <div class="perfil-info">
        <h2>{{ authStore.user.nombre || authStore.user.username }}</h2>
        <span class="role-badge">{{ roleName }}</span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="label">Usuario</span>
          <span class="value">{{ authStore.user.username }}</span>
        </div>
        <div class="info-item">
          <span class="label">Email</span>
          <span class="value">{{ authStore.user.email }}</span>
        </div>
        <div class="info-item" v-if="authStore.user.legajo">
          <span class="label">Legajo</span>
          <span class="value">{{ authStore.user.legajo }}</span>
        </div>
        <div class="info-item">
          <span class="label">Rol</span>
          <span class="value">{{ roleName }}</span>
        </div>
      </div>
    </div>

    <div class="acciones-card">
      <h3>Acciones Rapidas</h3>
      <div class="acciones-grid">
        <router-link to="/mis-recibos" class="accion-link">
          Ver Mis Recibos
        </router-link>
        <router-link to="/dashboard" class="accion-link">
          Ir al Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perfil {
  max-width: 600px;
  margin: 0 auto;
}

.page-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.perfil-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4a90a4 0%, #357a8f 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
  margin: 0 auto 1rem;
}

.perfil-info h2 {
  color: #1a1a2e;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.role-badge {
  display: inline-block;
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
  text-align: left;
}

@media (max-width: 500px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item .label {
  color: #666;
  font-size: 0.85rem;
}

.info-item .value {
  color: #1a1a2e;
  font-weight: 500;
}

.acciones-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.acciones-card h3 {
  color: #1a1a2e;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.acciones-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.accion-link {
  display: inline-block;
  background: #f3f4f6;
  color: #374151;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.accion-link:hover {
  background: #e5e7eb;
  color: #1a1a2e;
}
</style>
