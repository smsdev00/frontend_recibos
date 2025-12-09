<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recibosApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import type { ReciboCompleto, ReciboConcepto } from '@/types'

const route = useRoute()
const router = useRouter()
const constantsStore = useConstantsStore()

const recibo = ref<ReciboCompleto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const downloadingPdf = ref(false)

const reciboId = computed(() => Number(route.params.id))

const haberes = computed(() => {
  if (!recibo.value) return []
  return recibo.value.conceptos.filter((c: ReciboConcepto) => c.codigo.startsWith('0'))
})

const deducciones = computed(() => {
  if (!recibo.value) return []
  return recibo.value.conceptos.filter((c: ReciboConcepto) => !c.codigo.startsWith('0'))
})

const totalHaberes = computed(() => {
  return haberes.value.reduce((sum: number, c: ReciboConcepto) => sum + Math.abs(c.monto), 0)
})

const totalDeducciones = computed(() => {
  return deducciones.value.reduce((sum: number, c: ReciboConcepto) => sum + Math.abs(c.monto), 0)
})

const netoAPagar = computed(() => {
  return totalHaberes.value - totalDeducciones.value
})

async function fetchRecibo() {
  loading.value = true
  error.value = null
  try {
    const response = await recibosApi.get(reciboId.value)
    recibo.value = response.data
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al cargar el recibo'
  } finally {
    loading.value = false
  }
}

function formatMonto(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(Math.abs(monto))
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
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes - 1] || `Mes ${mes}`
}

function goBack() {
  router.back()
}

async function descargarPdf() {
  if (!recibo.value) return

  downloadingPdf.value = true
  try {
    const response = await recibosApi.descargarPdf(reciboId.value)
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `recibo_${recibo.value.mes}-${recibo.value.anio}_${recibo.value.legajo}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al descargar el PDF'
  } finally {
    downloadingPdf.value = false
  }
}

onMounted(() => {
  constantsStore.fetchConstants()
  fetchRecibo()
})
</script>

<template>
  <div class="recibo-detalle">
    <div class="page-header">
      <button @click="goBack" class="btn-back">
        &#8592; Volver
      </button>
      <h1>Detalle del Recibo</h1>
      <button
        v-if="recibo"
        @click="descargarPdf"
        class="btn btn-pdf"
        :disabled="downloadingPdf"
      >
        {{ downloadingPdf ? 'Descargando...' : 'Descargar PDF' }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      <p>Cargando recibo...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchRecibo" class="btn btn-primary">Reintentar</button>
    </div>

    <div v-else-if="recibo" class="recibo-content">
      <div class="recibo-header-card">
        <div class="periodo-info">
          <h2>{{ getMesNombre(recibo.mes) }} {{ recibo.anio }}</h2>
          <span
            class="tipo-badge"
            :class="{ 'tipo-sac': recibo.tipo === 2, 'tipo-bono': recibo.tipo === 3 }"
          >
            {{ constantsStore.getTipoLiquidacionName(recibo.tipo) }}
          </span>
        </div>
        <div class="recibo-meta">
          <div class="meta-item">
            <span class="label">Legajo:</span>
            <span class="value">{{ recibo.legajo }}</span>
          </div>
          <div class="meta-item">
            <span class="label">Fecha Emision:</span>
            <span class="value">{{ formatDate(recibo.created) }}</span>
          </div>
          <div v-if="recibo.fecha_activacion" class="meta-item">
            <span class="label">Fecha Activacion:</span>
            <span class="value">{{ formatDate(recibo.fecha_activacion) }}</span>
          </div>
        </div>
      </div>

      <div class="conceptos-section">
        <div class="conceptos-column">
          <h3>Haberes</h3>
          <table class="conceptos-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Concepto</th>
                <th class="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="concepto in haberes" :key="concepto.id">
                <td class="codigo">{{ concepto.codigo }}</td>
                <td>{{ concepto.texto }}</td>
                <td class="text-right monto">{{ formatMonto(concepto.monto) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total Haberes</strong></td>
                <td class="text-right monto"><strong>{{ formatMonto(totalHaberes) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="conceptos-column">
          <h3>Deducciones</h3>
          <table class="conceptos-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Concepto</th>
                <th class="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="concepto in deducciones" :key="concepto.id">
                <td class="codigo">{{ concepto.codigo }}</td>
                <td>{{ concepto.texto }}</td>
                <td class="text-right monto deduccion">{{ formatMonto(concepto.monto) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total Deducciones</strong></td>
                <td class="text-right monto deduccion"><strong>{{ formatMonto(totalDeducciones) }}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="neto-section">
        <div class="neto-card">
          <span class="neto-label">Neto a Pagar</span>
          <span class="neto-monto">{{ formatMonto(netoAPagar) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recibo-detalle {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.page-header h1 {
  flex: 1;
  color: #1a1a2e;
  font-size: 1.5rem;
  margin: 0;
}

.btn-back {
  background: transparent;
  border: none;
  color: #4a90a4;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
}

.btn-back:hover {
  text-decoration: underline;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.error {
  color: #dc2626;
}

.recibo-header-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.periodo-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.periodo-info h2 {
  color: #1a1a2e;
  margin: 0;
}

.tipo-badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
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

.recibo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
}

.meta-item .label {
  color: #666;
}

.meta-item .value {
  color: #1a1a2e;
  font-weight: 500;
}

.conceptos-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .conceptos-section {
    grid-template-columns: 1fr;
  }
}

.conceptos-column {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.conceptos-column h3 {
  color: #1a1a2e;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.conceptos-table {
  width: 100%;
  border-collapse: collapse;
}

.conceptos-table th,
.conceptos-table td {
  padding: 0.625rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.conceptos-table th {
  color: #666;
  font-weight: 500;
  font-size: 0.85rem;
}

.conceptos-table .codigo {
  color: #666;
  font-family: monospace;
  font-size: 0.85rem;
}

.conceptos-table .text-right {
  text-align: right;
}

.conceptos-table .monto {
  font-family: monospace;
  color: #16a34a;
}

.conceptos-table .monto.deduccion {
  color: #dc2626;
}

.conceptos-table tfoot td {
  border-top: 2px solid #ddd;
  border-bottom: none;
  padding-top: 0.75rem;
}

.neto-section {
  display: flex;
  justify-content: flex-end;
}

.neto-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 1.5rem 2.5rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.neto-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.neto-monto {
  font-size: 1.75rem;
  font-weight: 700;
  font-family: monospace;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: #4a90a4;
  color: #fff;
}

.btn-pdf {
  background: #dc2626;
  color: #fff;
}

.btn-pdf:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-pdf:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
