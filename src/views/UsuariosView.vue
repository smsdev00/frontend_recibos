<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usersApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import { useAuthStore } from '@/stores/auth'
import type { User, PaginatedResponse, RoleInfo } from '@/types'

const router = useRouter()
const constantsStore = useConstantsStore()
const authStore = useAuthStore()

const usuarios = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const filtros = ref({
  username: undefined as string | undefined,
  legajo: undefined as number | undefined,
  nombre: undefined as string | undefined,
  email: undefined as string | undefined,
  role: undefined as string | undefined,
  activo: undefined as number | undefined
})

const pagination = ref({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0
})

async function fetchUsuarios() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, number | string | undefined> = {
      page: pagination.value.page,
      per_page: pagination.value.per_page
    }
    if (filtros.value.username) params.username = filtros.value.username
    if (filtros.value.legajo) params.legajo = filtros.value.legajo
    if (filtros.value.nombre) params.nombre = filtros.value.nombre
    if (filtros.value.email) params.email = filtros.value.email
    if (filtros.value.role) params.role = filtros.value.role
    if (filtros.value.activo !== undefined) params.activo = filtros.value.activo

    const response = await usersApi.list(params)
    const data: PaginatedResponse<User> = response.data
    usuarios.value = data.data
    pagination.value.total = data.total
    pagination.value.pages = data.pages
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al cargar usuarios'
  } finally {
    loading.value = false
  }
}

function buscar() {
  pagination.value.page = 1
  fetchUsuarios()
}

function limpiarFiltros() {
  filtros.value = {
    username: undefined,
    legajo: undefined,
    nombre: undefined,
    email: undefined,
    role: undefined,
    activo: undefined
  }
  pagination.value.page = 1
}

function goToPage(page: number) {
  pagination.value.page = page
  fetchUsuarios()
}

function nuevoUsuario() {
  router.push('/usuarios/nuevo')
}

function editarUsuario(id: number) {
  router.push(`/usuarios/${id}`)
}

onMounted(() => {
  constantsStore.fetchConstants()
  fetchUsuarios()
})
</script>

<template>
  <div class="usuarios">
    <div class="page-header">
      <h1>Usuarios</h1>
      <button
        v-if="authStore.isAdmin"
        @click="nuevoUsuario"
        class="btn btn-primary"
      >
        + Nuevo Usuario
      </button>
    </div>

    <div class="filtros-card">
      <form @submit.prevent="buscar" class="filtros-form">
        <div class="filtros-grid">
          <div class="form-group">
            <label>DNI</label>
            <input
              v-model="filtros.username"
              type="text"
              placeholder="Numero"
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label>Legajo</label>
            <input
              v-model.number="filtros.legajo"
              type="number"
              placeholder="Numero"
              min="100000"
            />
          </div>
          <div class="form-group">
            <label>Nombre</label>
            <input
              v-model="filtros.nombre"
              type="text"
              placeholder="Nombre"
            />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input
              v-model="filtros.email"
              type="email"
              placeholder="Email"
            />
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select v-model="filtros.role">
              <option :value="undefined">Todos</option>
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
            <label>Estado</label>
            <select v-model.number="filtros.activo">
              <option :value="undefined">Todos</option>
              <option :value="1">Activo</option>
              <option :value="0">Inactivo</option>
            </select>
          </div>
        </div>
        <div class="filtros-actions">
          <button type="button" @click="limpiarFiltros" class="btn btn-secondary">
            Limpiar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            Buscar
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="loading">
      <p>Cargando usuarios...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchUsuarios" class="btn btn-primary">Reintentar</button>
    </div>

    <div v-else-if="usuarios.length === 0" class="empty">
      <p>No se encontraron usuarios</p>
    </div>

    <div v-else class="resultados">
      <div class="resultados-header">
        <span class="total">{{ pagination.total }} usuarios encontrados</span>
      </div>

      <table class="usuarios-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Legajo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usuarios" :key="user.id">
            <td>{{ user.id }}</td>
            <td class="username">{{ user.username }}</td>
            <td>{{ user.nombre || '-' }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.legajo || '-' }}</td>
            <td>
              <span class="role-badge">
                {{ constantsStore.getRoleName(user.role || 'usuario') }}
              </span>
            </td>
            <td>
              <span class="estado" :class="{ 'activo': user.activo === 1 }">
                {{ user.activo === 1 ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <button @click="editarUsuario(user.id)" class="btn-action">
                {{ authStore.isAdmin ? 'Editar' : 'Ver' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="pagination.pages > 1" class="pagination">
        <button
          @click="goToPage(pagination.page - 1)"
          :disabled="pagination.page <= 1 || loading"
          class="btn-page"
        >
          Anterior
        </button>
        <span class="page-info">
          Pagina {{ pagination.page }} de {{ pagination.pages }}
        </span>
        <button
          @click="goToPage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.pages || loading"
          class="btn-page"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.usuarios {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
  margin: 0;
}

.filtros-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  color: #666;
  font-size: 0.85rem;
}

.form-group input,
.form-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #00AEC3;
}

.filtros-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: #00AEC3;
  color: #fff;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
}

.error {
  color: #dc2626;
}

.resultados {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.resultados-header {
  margin-bottom: 1rem;
}

.total {
  color: #666;
  font-size: 0.9rem;
}

.usuarios-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.usuarios-table th,
.usuarios-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.usuarios-table th {
  color: #00AEC3;
  font-weight: 500;
  font-size: 0.85rem;
}

.username {
  font-weight: 500;
  color: #00AEC3;
}

.role-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.estado {
  color: #666;
  font-size: 0.85rem;
}

.estado.activo {
  color: #16a34a;
}

.btn-action {
  background: transparent;
  border: 1px solid #00AEC3;
  color: #00AEC3;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-action:hover {
  background: #00AEC3;
  color: #fff;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn-page {
  background: #fff;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-page:hover:not(:disabled) {
  border-color: #00AEC3;
  color: #00AEC3;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}
</style>
