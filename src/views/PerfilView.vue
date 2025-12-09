<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConstantsStore } from '@/stores/constants'
import { authApi } from '@/services/api'

const authStore = useAuthStore()
const constantsStore = useConstantsStore()

const roleName = computed(() => {
  if (!authStore.user?.role) return 'Usuario'
  return constantsStore.getRoleName(authStore.user.role)
})

// Cambio de contraseña
const showPasswordForm = ref(false)
const passwordForm = ref({
  password_actual: '',
  nueva_password: '',
  confirmar_password: ''
})
const changingPassword = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref<string | null>(null)

async function handleChangePassword() {
  if (passwordForm.value.nueva_password !== passwordForm.value.confirmar_password) {
    passwordError.value = 'Las contrasenas no coinciden'
    return
  }

  if (passwordForm.value.nueva_password.length < 8) {
    passwordError.value = 'La contrasena debe tener al menos 8 caracteres'
    return
  }

  changingPassword.value = true
  passwordError.value = null
  passwordSuccess.value = null

  try {
    await authApi.changeMyPassword(
      passwordForm.value.password_actual,
      passwordForm.value.nueva_password
    )
    passwordSuccess.value = 'Contrasena actualizada correctamente'
    passwordForm.value = { password_actual: '', nueva_password: '', confirmar_password: '' }
    showPasswordForm.value = false
    setTimeout(() => {
      passwordSuccess.value = null
    }, 3000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { detail?: string; error?: { message?: string } } } }
    passwordError.value = axiosError.response?.data?.detail ||
                          axiosError.response?.data?.error?.message ||
                          'Error al cambiar la contrasena'
  } finally {
    changingPassword.value = false
  }
}

function cancelPasswordChange() {
  showPasswordForm.value = false
  passwordForm.value = { password_actual: '', nueva_password: '', confirmar_password: '' }
  passwordError.value = null
}
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

    <!-- Sección cambio de contraseña -->
    <div class="password-card">
      <div class="password-header">
        <h3>Seguridad</h3>
        <button
          v-if="!showPasswordForm"
          @click="showPasswordForm = true"
          class="btn btn-secondary"
        >
          Cambiar Contrasena
        </button>
      </div>

      <div v-if="passwordSuccess" class="message success">
        {{ passwordSuccess }}
      </div>

      <form v-if="showPasswordForm" @submit.prevent="handleChangePassword" class="password-form">
        <div class="form-group">
          <label for="password_actual">Contrasena Actual</label>
          <input
            id="password_actual"
            v-model="passwordForm.password_actual"
            type="password"
            required
            placeholder="Ingrese su contrasena actual"
          />
        </div>

        <div class="form-group">
          <label for="nueva_password">Nueva Contrasena</label>
          <input
            id="nueva_password"
            v-model="passwordForm.nueva_password"
            type="password"
            minlength="8"
            required
            placeholder="Minimo 8 caracteres"
          />
        </div>

        <div class="form-group">
          <label for="confirmar_password">Confirmar Nueva Contrasena</label>
          <input
            id="confirmar_password"
            v-model="passwordForm.confirmar_password"
            type="password"
            required
            placeholder="Repetir nueva contrasena"
          />
        </div>

        <div v-if="passwordError" class="message error">
          {{ passwordError }}
        </div>

        <div class="form-actions">
          <button type="button" @click="cancelPasswordChange" class="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="changingPassword">
            {{ changingPassword ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
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

/* Estilos para cambio de contraseña */
.password-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.password-header h3 {
  color: #1a1a2e;
  font-size: 1rem;
  margin: 0;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.625rem 0.875rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus {
  outline: none;
  border-color: #4a90a4;
  box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.1);
}

.message {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.message.error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.message.success {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-primary {
  background: #4a90a4;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #357a8f;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
