<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { recibosApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import type { Recibo, PaginatedResponse } from '@/types'

const router = useRouter()
const constantsStore = useConstantsStore()

const recibos = ref<Recibo[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const errorCode = ref<string | null>(null)
const pagination = ref({
  page: 1,
  per_page: 10,
  total: 0,
  pages: 0
})

// Filtros
const filtros = ref({
  tipo: undefined as number | undefined,
  anio: undefined as number | undefined,
  mes: undefined as number | undefined
})

// Lista de años (últimos 10 años)
const aniosDisponibles = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 0; i < 10; i++) {
    years.push(currentYear - i)
  }
  return years
})

// Lista de meses
const mesesDisponibles = [
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

async function fetchRecibos() {
  loading.value = true
  error.value = null
  errorCode.value = null
  try {
    const response = await recibosApi.misRecibos({
      page: pagination.value.page,
      per_page: pagination.value.per_page,
      tipo: filtros.value.tipo,
      anio: filtros.value.anio,
      mes: filtros.value.mes
    })
    const data: PaginatedResponse<Recibo> = response.data
    recibos.value = data.data
    pagination.value.total = data.total
    pagination.value.pages = data.pages
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string, code?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al cargar recibos'
    errorCode.value = axiosError.response?.data?.error?.code || null
  } finally {
    loading.value = false
  }
}

function goToPage(page: number) {
  pagination.value.page = page
  fetchRecibos()
}

function aplicarFiltros() {
  pagination.value.page = 1
  fetchRecibos()
}

function limpiarFiltros() {
  filtros.value.tipo = undefined
  filtros.value.anio = undefined
  filtros.value.mes = undefined
  pagination.value.page = 1
  fetchRecibos()
}



function getMesNombre(mes: number) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes - 1] || `Mes ${mes}`
}

function verRecibo(id: number) {
  router.push(`/recibos/${id}`)
}

onMounted(() => {
  constantsStore.fetchConstants()
  fetchRecibos()
})
</script>

<template>
  <div class="mis-recibos">
    <div class="page-header">
      <h1>Mis Recibos</h1>
    </div>

    <!-- Filtros -->
    <div class="filtros-section">
      <div class="filtros-grid">
        <div class="filtro-group">
          <label for="filtro-tipo">Tipo</label>
          <select id="filtro-tipo" v-model="filtros.tipo" class="filtro-select">
            <option :value="undefined">Todos</option>
            <option
              v-for="tipo in constantsStore.tiposLiquidacion"
              :key="tipo.id"
              :value="tipo.id"
            >
              {{ tipo.nombre }}
            </option>
          </select>
        </div>
        <div class="filtro-group">
          <label for="filtro-anio">Año</label>
          <select id="filtro-anio" v-model="filtros.anio" class="filtro-select">
            <option :value="undefined">Todos</option>
            <option v-for="anio in aniosDisponibles" :key="anio" :value="anio">
              {{ anio }}
            </option>
          </select>
        </div>
        <div class="filtro-group">
          <label for="filtro-mes">Mes</label>
          <select id="filtro-mes" v-model="filtros.mes" class="filtro-select">
            <option :value="undefined">Todos</option>
            <option v-for="mes in mesesDisponibles" :key="mes.value" :value="mes.value">
              {{ mes.label }}
            </option>
          </select>
        </div>
        <div class="filtro-actions">
          <button @click="aplicarFiltros" class="btn btn-primary">Filtrar</button>
          <button @click="limpiarFiltros" class="btn btn-secondary">Limpiar</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>Cargando recibos...</p>
    </div>

    <div v-else-if="error" class="error">
      <template v-if="errorCode === 'NO_LEGAJO'">
        <p class="error-title">Sin legajo asignado</p>
        <p class="error-description">Tu usuario no tiene un legajo asociado. Para ver tus recibos de sueldo, contacta al administrador para que asocie tu legajo a tu cuenta.</p>
      </template>
      <template v-else>
        <p>{{ error }}</p>
        <button @click="fetchRecibos" class="btn btn-primary">Reintentar</button>
      </template>
    </div>

    <div v-else-if="recibos.length === 0" class="empty">
      <p>No se encontraron recibos</p>
    </div>

    <div v-else>
      <div class="recibos-grid">
        <div
          v-for="recibo in recibos"
          :key="recibo.id"
          class="recibo-card"
          @click="verRecibo(recibo.id)"
        >
          <div class="recibo-header">
            <span class="periodo">{{ getMesNombre(recibo.mes) }} {{ recibo.anio }}</span>
            <span
              class="tipo-badge"
              :class="{ 'tipo-sac': recibo.tipo === 2, 'tipo-bono': recibo.tipo === 3 }"
            >
              {{ constantsStore.getTipoLiquidacionName(recibo.tipo) }}
            </span>
          </div>
          <div class="recibo-body">


          </div>
          <div class="recibo-footer">

            <button class="btn-ver">Ver detalle</button>
          </div>
        </div>
      </div>

      <div v-if="pagination.pages > 1" class="pagination">
        <button
          @click="goToPage(pagination.page - 1)"
          :disabled="pagination.page <= 1"
          class="btn-page"
        >
          Anterior
        </button>
        <span class="page-info">
          Pagina {{ pagination.page }} de {{ pagination.pages }}
        </span>
        <button
          @click="goToPage(pagination.page + 1)"
          :disabled="pagination.page >= pagination.pages"
          class="btn-page"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mis-recibos {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.error {
  color: #dc2626;
}

.error .error-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.5rem;
}

.error .error-description {
  color: #666;
  font-size: 0.95rem;
  max-width: 400px;
  margin: 0 auto;
}

.error button {
  margin-top: 1rem;
}

.recibos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.recibo-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.recibo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.recibo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.periodo {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 1.1rem;
}

.tipo-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tipo-badge.tipo-sac {
  background: #dcfce7;
  color: #166534;
}

.tipo-badge.tipo-bono {
  background: #fef3c7;
  color: #92400e;
}

.recibo-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.recibo-info {
  display: flex;
  gap: 0.5rem;
}

.recibo-info .label {
  color: #666;
  font-size: 0.9rem;
}

.recibo-info .value {
  color: #1a1a2e;
  font-size: 0.9rem;
}

.recibo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.estado {
  font-size: 0.8rem;
  color: #666;
}

.estado.activo {
  color: #16a34a;
}

.btn-ver {
  background: transparent;
  border: 1px solid #00AEC3;
  color: #00AEC3;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
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
  margin-top: 2rem;
}

.btn-page {
  background: #fff;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
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

.btn-primary:hover {
  background: #3d7a8c;
}

.btn-secondary {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  border-color: #999;
  color: #333;
}

/* Filtros */
.filtros-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
}

.filtros-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 150px;
}

.filtro-group label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.filtro-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filtro-select:hover {
  border-color: #00AEC3;
}

.filtro-select:focus {
  outline: none;
  border-color: #00AEC3;
  box-shadow: 0 0 0 2px rgba(74, 144, 164, 0.2);
}

.filtro-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

@media (max-width: 768px) {
  .filtros-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .filtro-group {
    min-width: 100%;
  }

  .filtro-actions {
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .filtro-actions .btn {
    flex: 1;
  }
}
</style>
