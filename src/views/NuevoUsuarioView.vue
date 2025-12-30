<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import type { RoleInfo } from '@/types'

const router = useRouter()
const constantsStore = useConstantsStore()

const loading = ref(false)
const error = ref<string | null>(null)

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'usuario',
  legajo: undefined as number | undefined,
  nombre: ''
})

async function handleSubmit() {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (form.value.password.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  loading.value = true
  error.value = null

  try {
    await usersApi.create({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
      role: form.value.role,
      legajo: form.value.legajo,
      nombre: form.value.nombre || undefined
    })
    router.push('/usuarios')
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al crear el usuario'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  constantsStore.fetchConstants()
})
</script>

<template>
  <div class="nuevo-usuario">
    <div class="page-header">
      <button @click="goBack" class="btn-back">
        &#8592; Volver
      </button>
      <h1>Nuevo Usuario</h1>
    </div>

    <div class="form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-group">
            <label for="username">Usuario *</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              minlength="1"
              maxlength="100"
              placeholder="Nombre de usuario"
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Contrasena *</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              placeholder="Minimo 8 caracteres"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contrasena *</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              placeholder="Repetir contraseña"
            />
          </div>

          <div class="form-group">
            <label for="role">Rol *</label>
            <select id="role" v-model="form.role" required>
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
            <label for="legajo">Legajo</label>
            <input
              id="legajo"
              v-model.number="form.legajo"
              type="number"
              min="100000"
              placeholder="Numero de legajo"
            />
          </div>

          <div class="form-group full-width">
            <label for="nombre">Nombre Completo</label>
            <input
              id="nombre"
              v-model="form.nombre"
              type="text"
              maxlength="200"
              placeholder="Nombre y apellido"
            />
          </div>
        </div>

        <div v-if="error" class="message error">
          {{ error }}
        </div>

        <div class="form-actions">
          <button type="button" @click="goBack" class="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Creando...' : 'Crear Usuario' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.nuevo-usuario {
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
  color: var(--pba-celeste);
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

.form-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  border-color: var(--pba-celeste);
  box-shadow: 0 0 0 3px rgba(0, 152, 217, 0.15);
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
  background: var(--pba-celeste);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--pba-celeste-dark);
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
