<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { personalApi } from '@/services/api'
import type { Personal, PaginatedResponse } from '@/types'

const personal = ref<Personal[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const filtros = ref({
  legajo: undefined as number | undefined,
  nombre: undefined as string | undefined,
  programa: undefined as string | undefined,
  doc_nro: undefined as number | undefined
})

const pagination = ref({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0
})

async function fetchPersonal() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, number | string | undefined> = {
      page: pagination.value.page,
      per_page: pagination.value.per_page
    }
    if (filtros.value.legajo) params.legajo = filtros.value.legajo
    if (filtros.value.nombre) params.nombre = filtros.value.nombre
    if (filtros.value.programa) params.programa = filtros.value.programa
    if (filtros.value.doc_nro) params.doc_nro = filtros.value.doc_nro

    const response = await personalApi.list(params)
    const data: PaginatedResponse<Personal> = response.data
    personal.value = data.data
    pagination.value.total = data.total
    pagination.value.pages = data.pages
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al cargar personal'
  } finally {
    loading.value = false
  }
}

function buscar() {
  pagination.value.page = 1
  fetchPersonal()
}

function limpiarFiltros() {
  filtros.value = {
    legajo: undefined,
    nombre: undefined,
    programa: undefined,
    doc_nro: undefined
  }
  pagination.value.page = 1
}

function goToPage(page: number) {
  pagination.value.page = page
  fetchPersonal()
}

function formatCuil(cuil: number) {
  const cuilStr = String(cuil).padStart(11, '0')
  return `${cuilStr.slice(0, 2)}-${cuilStr.slice(2, 10)}-${cuilStr.slice(10)}`
}

function soloNumeros(event: KeyboardEvent) {
  if (!/\d/.test(event.key)) {
    event.preventDefault()
  }
}

function sinNumeros(event: KeyboardEvent) {
  if (/\d/.test(event.key)) {
    event.preventDefault()
  }
}

function limitarDni(event: Event) {
  const input = event.target as HTMLInputElement
  const max = 999999999
  if (Number(input.value) > max) {
    input.value = String(max)
    filtros.value.doc_nro = max
  }
}

function limitarLegajo(event: Event) {
  const input = event.target as HTMLInputElement
  const max = 999999
  if (Number(input.value) > max) {
    input.value = String(max)
    filtros.value.legajo = max
  }
}

function limitarNombre(event: Event) {
  const input = event.target as HTMLInputElement
  const max = 100
  let value = input.value.replace(/\d/g, '')
  if (value.length > max) {
    value = value.slice(0, max)
  }
  input.value = value
  filtros.value.nombre = value || undefined
}

onMounted(() => {
  fetchPersonal()
})
</script>

<template>
  <div class="personal">
    <div class="page-header">
      <h1>Personal</h1>
    </div>

    <div class="filtros-card">
      <form @submit.prevent="buscar" class="filtros-form">
        <div class="filtros-grid">
          <div class="form-group">
            <label>DNI</label>
            <input
              v-model.number="filtros.doc_nro"
              type="number"
              placeholder="Numero"
              min="100000"
              max="999999999"
              @keypress="soloNumeros"
              @input="limitarDni"
            />
          </div>
          <div class="form-group">
            <label>Legajo</label>
            <input
              v-model.number="filtros.legajo"
              type="number"
              placeholder="Numero"
              min="100000"
              max="999999"
              @keypress="soloNumeros"
              @input="limitarLegajo"
            />
          </div>
          <div class="form-group">
            <label>Nombre</label>
            <input
              v-model="filtros.nombre"
              type="text"
              placeholder="Buscar nombre"
              maxlength="100"
              @keypress="sinNumeros"
              @input="limitarNombre"
            />
          </div>
          <div class="form-group">
            <label>Programa</label>
            <input
              v-model="filtros.programa"
              type="text"
              placeholder="Codigo"
            />
          </div>

          <div class="form-group form-actions">
            <button type="button" @click="limpiarFiltros" class="btn btn-secondary">
              Limpiar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              Buscar
            </button>
          </div>
        </div>
      </form>
    </div>

    <div v-if="loading" class="loading">
      <p>Cargando personal...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchPersonal" class="btn btn-primary">Reintentar</button>
    </div>

    <div v-else-if="personal.length === 0" class="empty">
      <p>No se encontraron registros</p>
    </div>

    <div v-else class="resultados">
      <div class="resultados-header">
        <span class="total">{{ pagination.total }} registros encontrados</span>
      </div>

      <div class="table-wrapper">
        <table class="personal-table">
          <thead>
            <tr>
              <th>Legajo</th>
              <th>Nombre</th>
              <th>CUIL</th>
              <th>Programa</th>
              <th>Agrup.</th>
              <th>Cat.</th>
              <th>Hs</th>
              <th>Años</th>
              <th>Ley</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in personal" :key="p.id">
              <td class="legajo">{{ p.legajo }}</td>
              <td>{{ p.nombre }}</td>
              <td class="mono">{{ formatCuil(p.cuil) }}</td>
              <td class="mono">{{ p.programa }}</td>
              <td>{{ p.agrupamiento }}</td>
              <td class="center">{{ p.categoria }}</td>
              <td class="center">{{ p.horas }}</td>
              <td class="center">{{ p.anios }}</td>
              <td class="mono">{{ p.ley }}</td>
            </tr>
          </tbody>
        </table>
      </div>

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
.personal {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
}

.filtros-card {
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.filtros-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 140px;
}

.form-group label {
  color: #666;
  font-size: 0.85rem;
}

.form-group input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-group input:focus {
  outline: none;
  border-color: var(--pba-celeste);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--pba-celeste);
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
}

.resultados-header {
  margin-bottom: 1rem;
}

.total {
  color: #666;
  font-size: 0.9rem;
}

.table-wrapper {
  overflow-x: auto;
}

.personal-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.personal-table th,
.personal-table td {
  padding: 0.625rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.personal-table th {
  color: var(--pba-celeste);
  font-weight: 500;
  font-size: 0.85rem;
  white-space: nowrap;
}

.personal-table td {
  font-size: 0.9rem;
}

.personal-table .legajo {
  font-weight: 600;
  color: var(--pba-celeste);
}

.personal-table .mono {
  font-family: monospace;
  font-size: 0.85rem;
}

.personal-table .center {
  text-align: center;
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
  border-color: var(--pba-celeste);
  color: var(--pba-celeste);
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

/* Ocultar flechas de inputs numéricos */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
