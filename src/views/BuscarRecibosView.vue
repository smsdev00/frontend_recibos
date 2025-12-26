<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { recibosApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import type { Recibo, PaginatedResponse, TipoLiquidacionInfo } from '@/types'

const router = useRouter()
const constantsStore = useConstantsStore()

const recibos = ref<Recibo[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const filtros = ref({
  dni: undefined as number | undefined,
  mes: undefined as number | undefined,
  anio: undefined as number | undefined,
  tipo: undefined as number | undefined,
  activa: undefined as number | undefined
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

async function buscar() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, number | undefined> = {
      page: pagination.value.page,
      per_page: pagination.value.per_page
    }
    if (filtros.value.dni) params.dni = filtros.value.dni
    if (filtros.value.mes) params.mes = filtros.value.mes
    if (filtros.value.anio) params.anio = filtros.value.anio
    if (filtros.value.tipo) params.tipo = filtros.value.tipo
    if (filtros.value.activa !== undefined) params.activa = filtros.value.activa

    const response = await recibosApi.buscar(params)
    const data: PaginatedResponse<Recibo> = response.data
    recibos.value = data.data
    pagination.value.total = data.total
    pagination.value.pages = data.pages
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al buscar recibos'
  } finally {
    loading.value = false
  }
}

function limpiarFiltros() {
  filtros.value = {
    dni: undefined,
    mes: undefined,
    anio: undefined,
    tipo: undefined,
    activa: undefined
  }
  pagination.value.page = 1
  recibos.value = []
}

function goToPage(page: number) {
  pagination.value.page = page
  buscar()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR')
}

function getMesNombre(mes: number) {
  return meses.find(m => m.value === mes)?.label || `Mes ${mes}`
}

function verRecibo(id: number) {
  router.push(`/recibos/${id}`)
}

onMounted(() => {
  constantsStore.fetchConstants()
})
</script>

<template>
  <div class="buscar-recibos">
    <div class="page-header">
      <h1>Buscar Recibos</h1>
    </div>

    <div class="filtros-card">
      <h2>Filtros de busqueda</h2>
      <form @submit.prevent="buscar" class="filtros-form">
        <div class="filtros-grid">
          <div class="form-group">
            <label>DNI</label>
            <input
              v-model.number="filtros.dni"
              type="number"
              placeholder="Numero de DNI"
              min="100000"
              required
            />
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
            <label>Mes</label>
            <select v-model.number="filtros.mes">
              <option :value="undefined">Todos</option>
              <option v-for="mes in meses" :key="mes.value" :value="mes.value">
                {{ mes.label }}
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
        </div>
        <div class="filtros-actions">
          <button type="button" @click="limpiarFiltros" class="btn btn-secondary">
            Limpiar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-if="recibos.length > 0" class="resultados">
      <div class="resultados-header">
        <h2>Resultados</h2>
        <span class="total">{{ pagination.total }} recibos encontrados</span>
      </div>

      <table class="recibos-table">
        <thead>
          <tr>
            <th>Legajo</th>
            <th>Periodo</th>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="recibo in recibos" :key="recibo.id">
            <td>{{ recibo.legajo }}</td>
            <td>{{ getMesNombre(recibo.mes) }} {{ recibo.anio }}</td>
            <td>
              <span
                class="tipo-badge"
                :class="{ 'tipo-sac': recibo.tipo === 2, 'tipo-bono': recibo.tipo === 3 }"
              >
                {{ constantsStore.getTipoLiquidacionName(recibo.tipo) }}
              </span>
            </td>
            <td>{{ formatDate(recibo.created) }}</td>
            <td>
              <span class="estado" :class="{ 'activo': recibo.activa === 1 }">
                {{ recibo.activa === 1 ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <button @click="verRecibo(recibo.id)" class="btn-ver">
                Ver
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
.buscar-recibos {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.filtros-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.filtros-card h2 {
  color: #1a1a2e;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
  font-size: 0.9rem;
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

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.resultados {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.resultados-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.resultados-header h2 {
  color: #1a1a2e;
  font-size: 1.1rem;
  margin: 0;
}

.total {
  color: #666;
  font-size: 0.9rem;
}

.recibos-table {
  width: 100%;
  border-collapse: collapse;
}

.recibos-table th,
.recibos-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.recibos-table th {
  color: #00AEC3;
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

.estado {
  color: #666;
  font-size: 0.85rem;
}

.estado.activo {
  color: #16a34a;
}

.btn-ver {
  background: transparent;
  border: 1px solid #00AEC3;
  color: #00AEC3;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-ver:hover {
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
