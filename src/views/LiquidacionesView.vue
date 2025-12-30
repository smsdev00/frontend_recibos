<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { liquidacionesApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import { useAuthStore } from '@/stores/auth'
import type { Liquidacion, PaginatedResponse, TipoLiquidacionInfo } from '@/types'

const router = useRouter()
const constantsStore = useConstantsStore()
const authStore = useAuthStore()

const liquidaciones = ref<Liquidacion[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref<number | null>(null)

const filtros = ref({
  mes: undefined as number | undefined,
  anio: undefined as number | undefined,
  tipo: undefined as number | undefined
})

const pagination = ref({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0
})

const meses = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

const anios = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

async function fetchLiquidaciones() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, number | undefined> = {
      page: pagination.value.page,
      per_page: pagination.value.per_page
    }
    if (filtros.value.mes) params.mes = filtros.value.mes
    if (filtros.value.anio) params.anio = filtros.value.anio
    if (filtros.value.tipo) params.tipo = filtros.value.tipo

    const response = await liquidacionesApi.list(params)
    const data: PaginatedResponse<Liquidacion> = response.data
    liquidaciones.value = data.data
    pagination.value.total = data.total
    pagination.value.pages = data.pages
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al cargar liquidaciones'
  } finally {
    loading.value = false
  }
}

async function toggleActiva(liq: Liquidacion) {
  if (!authStore.canManageLiquidaciones) return
  actionLoading.value = liq.id
  try {
    await liquidacionesApi.toggleActiva(liq.id)
    liq.activa = liq.activa === 1 ? 0 : 1
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    alert(axiosError.response?.data?.error?.message || 'Error al cambiar estado')
  } finally {
    actionLoading.value = null
  }
}

async function eliminar(liq: Liquidacion) {
  if (!authStore.isAdmin) return
  if (!confirm(`¿Esta seguro de eliminar la liquidacion ${getMesNombre(liq.mes)} ${liq.anio}?`)) {
    return
  }
  actionLoading.value = liq.id
  try {
    await liquidacionesApi.delete(liq.id)
    liquidaciones.value = liquidaciones.value.filter(l => l.id !== liq.id)
    pagination.value.total--
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    alert(axiosError.response?.data?.error?.message || 'Error al eliminar')
  } finally {
    actionLoading.value = null
  }
}

async function descargarArchivos(liq: Liquidacion) {
  if (!authStore.isAdmin) return
  actionLoading.value = liq.id
  try {
    const response = await liquidacionesApi.descargarArchivos(liq.id)
    const blob = new Blob([response.data], { type: 'application/zip' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const mes = String(liq.mes).padStart(2, '0')
    link.download = `liquidacion_${mes}_${liq.anio}_tipo${liq.tipo}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    alert(axiosError.response?.data?.error?.message || 'Error al descargar archivos')
  } finally {
    actionLoading.value = null
  }
}

function goToPage(page: number) {
  pagination.value.page = page
  fetchLiquidaciones()
}

function buscar() {
  pagination.value.page = 1
  fetchLiquidaciones()
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function getMesNombre(mes: number) {
  return meses.find(m => m.value === mes)?.label || `Mes ${mes}`
}

function getEstadoClass(estado: number) {
  switch (estado) {
    case 1: return 'estado-pendiente'
    case 2: return 'estado-procesando'
    case 3: return 'estado-procesada'
    case -1: return 'estado-error'
    default: return ''
  }
}

function nuevaLiquidacion() {
  router.push('/liquidaciones/nueva')
}

onMounted(() => {
  constantsStore.fetchConstants()
  fetchLiquidaciones()
})
</script>

<template>
  <div class="liquidaciones">
    <div class="page-header">
      <h1>Liquidaciones</h1>
      <button
        v-if="authStore.canManageLiquidaciones"
        @click="nuevaLiquidacion"
        class="btn btn-primary"
      >
        + Nueva Liquidacion
      </button>
    </div>

    <div class="filtros-card">
      <form @submit.prevent="buscar" class="filtros-form">
        <div class="filtros-grid">
          <div class="form-group">
            <label>Mes</label>
            <select v-model.number="filtros.mes">
              <option :value="undefined">Todos</option>
              <option v-for="mes in meses" :key="mes.value" :value="mes.value">
                {{ mes.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Año</label>
            <select v-model.number="filtros.anio">
              <option :value="undefined">Todos</option>
              <option v-for="anio in anios" :key="anio" :value="anio">
                {{ anio }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select v-model.number="filtros.tipo">
              <option :value="undefined">Todos</option>
              <option
                v-for="tipo in constantsStore.tiposLiquidacion"
                :key="tipo.id"
                :value="(tipo as TipoLiquidacionInfo).id"
              >
                {{ (tipo as TipoLiquidacionInfo).nombre }}
              </option>
            </select>
          </div>
          <div class="form-group form-actions">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              Filtrar
            </button>
          </div>
        </div>
      </form>
    </div>

    <div v-if="loading" class="loading">
      <p>Cargando liquidaciones...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchLiquidaciones" class="btn btn-primary">Reintentar</button>
    </div>

    <div v-else-if="liquidaciones.length === 0" class="empty">
      <p>No se encontraron liquidaciones</p>
    </div>

    <div v-else class="resultados">
      <table class="liquidaciones-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Periodo</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Activa</th>
            <th>F. Activacion</th>
            <th>Creada</th>
            <th v-if="authStore.canManageLiquidaciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="liq in liquidaciones" :key="liq.id">
            <td>{{ liq.id }}</td>
            <td>{{ getMesNombre(liq.mes) }} {{ liq.anio }}</td>
            <td>
              <span
                class="tipo-badge"
                :class="{ 'tipo-sac': liq.tipo === 2, 'tipo-bono': liq.tipo === 3 }"
              >
                {{ constantsStore.getTipoLiquidacionName(liq.tipo) }}
              </span>
            </td>
            <td>
              <span class="estado-badge" :class="getEstadoClass(liq.estado)">
                {{ constantsStore.getEstadoLiquidacionName(liq.estado) }}
              </span>
            </td>
            <td>
              <span class="activa" :class="{ 'activa-si': liq.activa === 1 }">
                {{ liq.activa === 1 ? 'Si' : 'No' }}
              </span>
            </td>
            <td>{{ formatDate(liq.fecha_activacion) }}</td>
            <td>{{ formatDate(liq.created) }}</td>
            <td v-if="authStore.canManageLiquidaciones" class="acciones">
              <button
                @click="toggleActiva(liq)"
                class="btn-action"
                :disabled="actionLoading === liq.id"
                :title="liq.activa === 1 ? 'Desactivar' : 'Activar'"
              >
                {{ liq.activa === 1 ? 'Desactivar' : 'Activar' }}
              </button>
              <button
                v-if="authStore.isAdmin && liq.estado === 3"
                @click="descargarArchivos(liq)"
                class="btn-action btn-download"
                :disabled="actionLoading === liq.id"
                title="Descargar archivos ZIP"
              >
                Descargar
              </button>
              <button
                v-if="authStore.isAdmin"
                @click="eliminar(liq)"
                class="btn-action btn-danger"
                :disabled="actionLoading === liq.id || liq.activa === 1"
                title="Eliminar"
              >
                Eliminar
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
.liquidaciones {
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
  min-width: 150px;
}

.form-group label {
  color: #666;
  font-size: 0.85rem;
}

.form-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-actions {
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

.liquidaciones-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.liquidaciones-table th,
.liquidaciones-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.liquidaciones-table th {
  color: var(--pba-celeste);
  font-weight: 500;
  font-size: 0.85rem;
}

.tipo-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.tipo-badge.tipo-sac {
  background: #dcfce7;
  color: #166534;
}

.tipo-badge.tipo-bono {
  background: #fef3c7;
  color: #92400e;
}

.estado-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.estado-pendiente {
  background: #fef3c7;
  color: #92400e;
}

.estado-procesando {
  background: #dbeafe;
  color: #1e40af;
}

.estado-procesada {
  background: #dcfce7;
  color: #166534;
}

.estado-error {
  background: #fee2e2;
  color: #dc2626;
}

.activa {
  color: #666;
}

.activa.activa-si {
  color: #16a34a;
  font-weight: 500;
}

.acciones {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  background: #f3f4f6;
  border: 1px solid #ddd;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-action:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action.btn-danger {
  color: #dc2626;
  border-color: #fca5a5;
}

.btn-action.btn-danger:hover:not(:disabled) {
  background: #fee2e2;
}

.btn-action.btn-download {
  color: #0369a1;
  border-color: #7dd3fc;
}

.btn-action.btn-download:hover:not(:disabled) {
  background: #e0f2fe;
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
</style>
