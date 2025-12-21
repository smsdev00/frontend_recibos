<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usersApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import { useAuthStore } from '@/stores/auth'
import type { User, RoleInfo } from '@/types'

const route = useRoute()
const router = useRouter()
const constantsStore = useConstantsStore()
const authStore = useAuthStore()

const userId = computed(() => Number(route.params.id))

// Verificar si el usuario a editar es administrador y si el usuario actual puede editarlo
const targetIsAdmin = computed(() => usuario.value?.role === 'administrador')
const canEditThisUser = computed(() => {
  // Si el usuario a editar es admin, solo un admin puede editarlo
  if (targetIsAdmin.value) {
    return authStore.isAdmin
  }
  return true
})
const canChangePasswordForThisUser = computed(() => {
  // Solo mesa de ayuda o admin puede cambiar contraseñas
  // Pero si el target es admin, solo admin puede cambiar su contraseña
  if (targetIsAdmin.value) {
    return authStore.isAdmin
  }
  return authStore.isMesaAyuda
})

const usuario = ref<User | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const form = ref({
  email: '',
  role: '',
  activo: 1
})

const passwordForm = ref({
  nueva_password: '',
  confirmar_password: ''
})
const changingPassword = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref<string | null>(null)

// Eliminar usuario
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

async function fetchUsuario() {
  loading.value = true
  error.value = null
  try {
    const response = await usersApi.get(userId.value)
    usuario.value = response.data
    form.value = {
      email: response.data.email,
      role: response.data.role || 'usuario',
      activo: response.data.activo ?? 1
    }
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al cargar el usuario'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!authStore.isAdmin || !canEditThisUser.value) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await usersApi.update(userId.value, {
      email: form.value.email,
      role: form.value.role,
      activo: form.value.activo
    })
    success.value = 'Usuario actualizado correctamente'
    setTimeout(() => {
      success.value = null
    }, 3000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al actualizar el usuario'
  } finally {
    saving.value = false
  }
}

async function handleChangePassword() {
  if (passwordForm.value.nueva_password !== passwordForm.value.confirmar_password) {
    passwordError.value = 'Las contraseñas no coinciden'
    return
  }

  if (passwordForm.value.nueva_password.length < 8) {
    passwordError.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  changingPassword.value = true
  passwordError.value = null
  passwordSuccess.value = null

  try {
    await usersApi.changePassword(userId.value, passwordForm.value.nueva_password)
    passwordSuccess.value = 'Contrasena actualizada correctamente'
    passwordForm.value = { nueva_password: '', confirmar_password: '' }
    setTimeout(() => {
      passwordSuccess.value = null
    }, 3000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    passwordError.value = axiosError.response?.data?.error?.message || 'Error al cambiar la contraseña'
  } finally {
    changingPassword.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  deleteError.value = null

  try {
    await usersApi.delete(userId.value)
    router.push('/usuarios')
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    deleteError.value = axiosError.response?.data?.error?.message || 'Error al eliminar el usuario'
  } finally {
    deleting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  constantsStore.fetchConstants()
  fetchUsuario()
})
</script>

<template>
  <div class="editar-usuario">
    <div class="page-header">
      <button @click="goBack" class="btn-back">
        &#8592; Volver
      </button>
      <h1>{{ authStore.isAdmin && canEditThisUser ? 'Editar' : 'Ver' }} Usuario</h1>
    </div>

    <div v-if="loading" class="loading">
      <p>Cargando usuario...</p>
    </div>

    <div v-else-if="error && !usuario" class="error-card">
      <p>{{ error }}</p>
      <button @click="fetchUsuario" class="btn btn-primary">Reintentar</button>
    </div>

    <template v-else-if="usuario">
      <div class="form-card">
        <h2>Informacion del Usuario</h2>
        <div class="user-info">
          <div class="info-item">
            <span class="label">ID:</span>
            <span class="value">{{ usuario.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">Username:</span>
            <span class="value">{{ usuario.username }}</span>
          </div>
          <div v-if="usuario.nombre" class="info-item">
            <span class="label">Nombre:</span>
            <span class="value">{{ usuario.nombre }}</span>
          </div>
          <div v-if="usuario.legajo" class="info-item">
            <span class="label">Legajo:</span>
            <span class="value">{{ usuario.legajo }}</span>
          </div>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                :disabled="!authStore.isAdmin || !canEditThisUser"
                required
              />
            </div>

            <div class="form-group">
              <label for="role">Rol</label>
              <select id="role" v-model="form.role" :disabled="!authStore.isAdmin || !canEditThisUser" required>
                <option
                  v-for="role in constantsStore.roles"
                  :key="role.id"
                  :value="(role as RoleInfo).id"
                >
                  {{ (role as RoleInfo).nombre }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="activo">Estado</label>
              <select id="activo" v-model.number="form.activo" :disabled="!authStore.isAdmin || !canEditThisUser">
                <option :value="1">Activo</option>
                <option :value="0">Inactivo</option>
              </select>
            </div>
          </div>

          <div v-if="error" class="message error">
            {{ error }}
          </div>

          <div v-if="success" class="message success">
            {{ success }}
          </div>

          <div v-if="authStore.isAdmin && canEditThisUser" class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="!canEditThisUser && targetIsAdmin" class="warning-card">
        <p>No tienes permisos para editar a un usuario administrador.</p>
      </div>

      <div v-if="canChangePasswordForThisUser" class="form-card">
        <h2>Cambiar Contraseña</h2>
        <form @submit.prevent="handleChangePassword">
          <div class="form-grid">
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
              <label for="confirmar_password">Confirmar Contrasena</label>
              <input
                id="confirmar_password"
                v-model="passwordForm.confirmar_password"
                type="password"
                required
                placeholder="Repetir contraseña"
              />
            </div>
          </div>

          <div v-if="passwordError" class="message error">
            {{ passwordError }}
          </div>

          <div v-if="passwordSuccess" class="message success">
            {{ passwordSuccess }}
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="changingPassword">
              {{ changingPassword ? 'Cambiando...' : 'Cambiar Contraseña' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Zona de peligro: Eliminar usuario (solo admin) -->
      <div v-if="authStore.isAdmin && canEditThisUser" class="form-card danger-zone">
        <h2>Zona de Peligro</h2>
        <p>Eliminar este usuario lo borrara permanentemente.</p>
        <button @click="showDeleteModal = true" class="btn btn-danger">
          Eliminar Usuario
        </button>
      </div>

      <!-- Modal de confirmación -->
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal">
          <h3>Confirmar Eliminacion</h3>
          <p>Esta seguro que desea eliminar al usuario <strong>{{ usuario?.username }}</strong>?</p>
          <p class="modal-warning">Esta accion no se puede deshacer.</p>

          <div v-if="deleteError" class="message error">
            {{ deleteError }}
          </div>

          <div class="modal-actions">
            <button @click="showDeleteModal = false" class="btn btn-secondary" :disabled="deleting">
              Cancelar
            </button>
            <button @click="handleDelete" class="btn btn-danger" :disabled="deleting">
              {{ deleting ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.editar-usuario {
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-back {
  background: transparent;
  border: none;
  color: #00AEC3;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.btn-back:hover {
  text-decoration: underline;
}

.page-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
  margin: 0;
}

.loading,
.error-card {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
}

.error-card {
  color: #dc2626;
}

.warning-card {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  color: #92400e;
}

.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.form-card h2 {
  color: #1a1a2e;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.info-item .label {
  color: #666;
}

.info-item .value {
  font-weight: 500;
  color: #1a1a2e;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.625rem 0.875rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #00AEC3;
  box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background: #f3f4f6;
  color: #666;
  cursor: not-allowed;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
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
  background: #00AEC3;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #009AAD;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Zona de peligro */
.danger-zone {
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.danger-zone h2 {
  color: #dc2626;
}

.danger-zone p {
  color: #7f1d1d;
  margin-bottom: 1rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.modal p {
  color: #666;
  margin-bottom: 0.5rem;
}

.modal-warning {
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
