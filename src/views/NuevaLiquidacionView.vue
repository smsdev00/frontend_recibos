<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { liquidacionesApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import type { TipoLiquidacionInfo } from '@/types'

const router = useRouter()
const constantsStore = useConstantsStore()

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Estado del progreso WebSocket
const showProgress = ref(false)
const progressStatus = ref('')
const progressItemType = ref<'personal' | 'recibos' | null>(null)
const progressCurrent = ref(0)
const progressTotal = ref(0)
const progressPercentage = ref(0)
const personalCompleted = ref(false)
const recibosCompleted = ref(false)
let websocket: WebSocket | null = null

const progressLabel = computed(() => {
  if (progressItemType.value === 'personal') return 'Personal'
  if (progressItemType.value === 'recibos') return 'Recibos'
  return ''
})

const form = ref<{
  mes: number
  anio: number
  tipo: number
  fecha_activacion: string
  archivo_personal: File | null
  archivo_recibos: File | null
}>({
  mes: new Date().getMonth() + 1,
  anio: new Date().getFullYear(),
  tipo: 1,
  fecha_activacion: new Date().toISOString().split('T')[0] ?? '',
  archivo_personal: null,
  archivo_recibos: null
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

const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 1)

function handleFilePersonal(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    form.value.archivo_personal = file
  }
}

function handleFileRecibos(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    form.value.archivo_recibos = file
  }
}

function getWebSocketUrl(liquidacionId: number): string {
  const token = localStorage.getItem('access_token')
  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const baseUrl = apiUrl.replace(/^https?:/, wsProtocol)
  return `${baseUrl}/ws/liquidacion/${liquidacionId}?token=${token}`
}

function disconnectWebSocket() {
  if (websocket) {
    websocket.close()
    websocket = null
  }
}

async function handleSubmit() {
  const archivoPersonal = form.value.archivo_personal
  const archivoRecibos = form.value.archivo_recibos

  if (!archivoPersonal || !archivoRecibos) {
    error.value = 'Debe seleccionar ambos archivos'
    return
  }

  // Validar que mes/año de archivos coincidan con los declarados
  const infoPersonal = extraerMesAnioArchivo(archivoPersonal.name)
  if (!infoPersonal) {
    error.value = `No se pudo extraer mes/año del archivo "${archivoPersonal.name}". Formato esperado: PERSmmaa.TXT`
    return
  }
  if (infoPersonal.mes !== form.value.mes || infoPersonal.anio !== form.value.anio) {
    error.value = `El archivo ${archivoPersonal.name} corresponde a ${String(infoPersonal.mes).padStart(2, '0')}/${infoPersonal.anio} pero se declaró ${String(form.value.mes).padStart(2, '0')}/${form.value.anio}`
    return
  }

  const infoRecibos = extraerMesAnioArchivo(archivoRecibos.name)
  if (!infoRecibos) {
    error.value = `No se pudo extraer mes/año del archivo "${archivoRecibos.name}". Formato esperado: RECImmaa.TXT`
    return
  }
  if (infoRecibos.mes !== form.value.mes || infoRecibos.anio !== form.value.anio) {
    error.value = `El archivo ${archivoRecibos.name} corresponde a ${String(infoRecibos.mes).padStart(2, '0')}/${infoRecibos.anio} pero se declaró ${String(form.value.mes).padStart(2, '0')}/${form.value.anio}`
    return
  }

  loading.value = true
  error.value = null
  success.value = null
  showProgress.value = true
  progressStatus.value = 'Subiendo archivos...'
  progressItemType.value = null
  progressCurrent.value = 0
  progressTotal.value = 0
  progressPercentage.value = 0
  personalCompleted.value = false
  recibosCompleted.value = false

  try {
    const formData = new FormData()
    formData.append('archivo_personal', archivoPersonal)
    formData.append('archivo_recibos', archivoRecibos)
    formData.append('mes', String(form.value.mes))
    formData.append('anio', String(form.value.anio))
    formData.append('tipo', String(form.value.tipo))
    formData.append('fecha_activacion', form.value.fecha_activacion)

    // Enviamos la petición - retorna inmediatamente con el liquidacion_id
    const response = await liquidacionesApi.procesar(formData)
    const data = response.data

    // Conectar al WebSocket para recibir progreso en tiempo real
    if (data.liquidacion_id) {
      connectWebSocket(data.liquidacion_id)
      progressStatus.value = 'Conectando al servidor...'
    }

  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al procesar la liquidacion'
    showProgress.value = false
    loading.value = false
  }
}

function connectWebSocket(liquidacionId: number) {
  const wsUrl = getWebSocketUrl(liquidacionId)
  websocket = new WebSocket(wsUrl)

  websocket.onopen = () => {
    console.log('WebSocket conectado para liquidacion', liquidacionId)
    progressStatus.value = 'Procesando...'
  }

  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'status') {
        progressStatus.value = data.message
        // Detectar cuando se completa personal y empieza recibos
        if (data.message?.toLowerCase().includes('recibos') && progressItemType.value === 'personal') {
          personalCompleted.value = true
        }
      } else if (data.type === 'progress') {
        // Si cambiamos de personal a recibos, marcar personal como completado
        if (progressItemType.value === 'personal' && data.item_type === 'recibos') {
          personalCompleted.value = true
        }
        progressItemType.value = data.item_type
        progressCurrent.value = data.current
        progressTotal.value = data.total
        progressPercentage.value = data.percentage
      } else if (data.type === 'complete') {
        personalCompleted.value = true
        recibosCompleted.value = true
        progressStatus.value = 'Completado'
        progressPercentage.value = 100
        loading.value = false

        success.value = `Liquidacion procesada exitosamente. Registros de personal: ${formatNumber(data.registros_personal)}, Recibos: ${formatNumber(data.registros_recibos)}`

        setTimeout(() => {
          disconnectWebSocket()
          showProgress.value = false
          router.push('/liquidaciones')
        }, 2000)
      } else if (data.type === 'error') {
        error.value = data.message || 'Error durante el procesamiento'
        showProgress.value = false
        loading.value = false
        disconnectWebSocket()
      }
    } catch (e) {
      console.error('Error parseando mensaje WebSocket:', e)
    }
  }

  websocket.onerror = (event) => {
    console.error('Error WebSocket:', event)
    error.value = 'Error de conexion con el servidor'
    showProgress.value = false
    loading.value = false
  }

  websocket.onclose = () => {
    console.log('WebSocket desconectado')
  }
}

function goBack() {
  router.back()
}

function formatFechaActivacion(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatNumber(num: number): string {
  return num.toLocaleString('es-AR')
}

function extraerMesAnioArchivo(filename: string): { mes: number; anio: number } | null {
  // Busca 4 dígitos consecutivos (mmaa) en el nombre
  const match = filename.match(/(\d{2})(\d{2})/)
  if (!match || !match[1] || !match[2]) return null

  const mes = parseInt(match[1], 10)
  const anioCorto = parseInt(match[2], 10)
  const anio = 2000 + anioCorto

  if (mes < 1 || mes > 12) return null
  return { mes, anio }
}

onMounted(() => {
  constantsStore.fetchConstants()
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<template>
  <div class="nueva-liquidacion">
    <div class="page-header">
      <button @click="goBack" class="btn-back">
        &#8592; Volver
      </button>
      <h1>Nueva Liquidacion</h1>
    </div>

    <div class="form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-group">
            <label for="mes">Mes *</label>
            <select id="mes" v-model.number="form.mes" required>
              <option v-for="mes in meses" :key="mes.value" :value="mes.value">
                {{ mes.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="anio">Año *</label>
            <select id="anio" v-model.number="form.anio" required>
              <option v-for="anio in anios" :key="anio" :value="anio">
                {{ anio }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="tipo">Tipo *</label>
            <select id="tipo" v-model.number="form.tipo" required>
              <option
                v-for="tipo in constantsStore.tiposLiquidacion"
                :key="tipo.id"
                :value="(tipo as TipoLiquidacionInfo).id"
              >
                {{ (tipo as TipoLiquidacionInfo).nombre }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="fecha_activacion">Fecha de Activacion *</label>
            <input
              id="fecha_activacion"
              v-model="form.fecha_activacion"
              type="date"
              required
            />
            <small v-if="form.fecha_activacion" class="fecha-preview">
              {{ formatFechaActivacion(form.fecha_activacion) }}
            </small>
          </div>
        </div>

        <div class="form-section">
          <h3>Archivos de Datos</h3>

          <div class="file-group">
            <label for="archivo_personal">Archivo de Personal *</label>
            <div class="file-input">
              <input
                id="archivo_personal"
                type="file"
                accept=".txt,.csv"
                @change="handleFilePersonal"
                required
              />
              <span v-if="form.archivo_personal" class="file-name">
                {{ form.archivo_personal.name }}
              </span>
            </div>
            <small>Archivo TXT con datos de personal</small>
          </div>

          <div class="file-group">
            <label for="archivo_recibos">Archivo de Recibos *</label>
            <div class="file-input">
              <input
                id="archivo_recibos"
                type="file"
                accept=".txt,.csv"
                @change="handleFileRecibos"
                required
              />
              <span v-if="form.archivo_recibos" class="file-name">
                {{ form.archivo_recibos.name }}
              </span>
            </div>
            <small>Archivo TXT con datos de recibos</small>
          </div>
        </div>

        <!-- Overlay de progreso llamativo -->
        <Teleport to="body">
          <div v-if="showProgress" class="progress-overlay">
            <div class="progress-modal">
              <div class="progress-title">Procesando Liquidacion</div>

              <!-- Fases de progreso -->
              <div class="progress-phases">
                <div class="phase" :class="{
                  'active': progressItemType === 'personal' && !personalCompleted,
                  'completed': personalCompleted
                }">
                  <div class="phase-icon">
                    <span v-if="personalCompleted" class="checkmark">&#10003;</span>
                    <span v-else-if="progressItemType === 'personal'" class="spinner"></span>
                    <span v-else class="pending">1</span>
                  </div>
                  <div class="phase-label">Personal</div>
                </div>
                <div class="phase-connector" :class="{ 'completed': personalCompleted }"></div>
                <div class="phase" :class="{
                  'active': progressItemType === 'recibos' && !recibosCompleted,
                  'completed': recibosCompleted
                }">
                  <div class="phase-icon">
                    <span v-if="recibosCompleted" class="checkmark">&#10003;</span>
                    <span v-else-if="progressItemType === 'recibos'" class="spinner"></span>
                    <span v-else class="pending">2</span>
                  </div>
                  <div class="phase-label">Recibos</div>
                </div>
              </div>

              <!-- Porcentaje grande -->
              <div class="progress-percentage-big">
                {{ Math.round(progressPercentage) }}<span class="percent-symbol">%</span>
              </div>

              <!-- Barra de progreso grande -->
              <div class="progress-bar-container-big">
                <div class="progress-bar-big" :style="{ width: progressPercentage + '%' }">
                  <div class="progress-bar-glow"></div>
                </div>
              </div>

              <!-- Detalles -->
              <div class="progress-details">
                <div class="progress-status-text">{{ progressStatus }}</div>
                <div v-if="progressItemType" class="progress-counts">
                  {{ progressLabel }}: {{ formatNumber(progressCurrent) }} / {{ formatNumber(progressTotal) }}
                </div>
              </div>
            </div>
          </div>
        </Teleport>

        <div v-if="error" class="message error">
          {{ error }}
        </div>

        <div v-if="success" class="message success">
          {{ success }}
        </div>

        <div class="form-actions">
          <button type="button" @click="goBack" class="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Procesando...' : 'Procesar Liquidacion' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.nueva-liquidacion {
  max-width: 800px;
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
  margin-bottom: 2rem;
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

.fecha-preview {
  color: #00AEC3;
  font-weight: 500;
}

.form-section {
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-section h3 {
  color: #1a1a2e;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.file-group {
  margin-bottom: 1.5rem;
}

.file-group label {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.file-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-input input[type="file"] {
  padding: 0.5rem;
  border: 2px dashed #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.file-input input[type="file"]:hover {
  border-color: #00AEC3;
}

.file-name {
  color: #16a34a;
  font-size: 0.85rem;
}

.file-group small {
  color: #666;
  font-size: 0.8rem;
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

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Overlay de progreso llamativo */
.progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.progress-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 24px;
  padding: 3rem;
  min-width: 500px;
  max-width: 90vw;
  box-shadow: 0 25px 80px rgba(0, 174, 195, 0.3);
  border: 1px solid rgba(0, 174, 195, 0.2);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.progress-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2rem;
}

/* Fases de progreso */
.progress-phases {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2rem;
}

.phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.phase-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2d3748;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #718096;
  transition: all 0.3s ease;
  border: 3px solid #4a5568;
}

.phase.active .phase-icon {
  background: rgba(0, 174, 195, 0.2);
  border-color: #00AEC3;
  color: #00AEC3;
  box-shadow: 0 0 20px rgba(0, 174, 195, 0.4);
}

.phase.completed .phase-icon {
  background: #10b981;
  border-color: #10b981;
  color: #fff;
}

.phase-label {
  font-size: 0.9rem;
  color: #718096;
  font-weight: 500;
  transition: color 0.3s ease;
}

.phase.active .phase-label,
.phase.completed .phase-label {
  color: #fff;
}

.phase-connector {
  width: 60px;
  height: 4px;
  background: #4a5568;
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
  border-radius: 2px;
  transition: background 0.3s ease;
}

.phase-connector.completed {
  background: #10b981;
}

.checkmark {
  font-size: 1.5rem;
}

.pending {
  font-size: 1.1rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 174, 195, 0.3);
  border-top-color: #00AEC3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Porcentaje grande */
.progress-percentage-big {
  text-align: center;
  font-size: 5rem;
  font-weight: 700;
  color: #00AEC3;
  line-height: 1;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 40px rgba(0, 174, 195, 0.5);
}

.percent-symbol {
  font-size: 2.5rem;
  opacity: 0.7;
}

/* Barra de progreso grande */
.progress-bar-container-big {
  background: #2d3748;
  border-radius: 25px;
  height: 40px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
}

.progress-bar-big {
  height: 100%;
  background: linear-gradient(90deg, #00AEC3 0%, #00d4aa 50%, #00AEC3 100%);
  background-size: 200% 100%;
  border-radius: 25px;
  transition: width 0.3s ease;
  position: relative;
  animation: gradientMove 2s ease infinite;
}

@keyframes gradientMove {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 0%; }
}

.progress-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  border-radius: 25px 25px 0 0;
}

/* Detalles del progreso */
.progress-details {
  text-align: center;
}

.progress-status-text {
  font-size: 1.1rem;
  color: #a0aec0;
  margin-bottom: 0.5rem;
}

.progress-counts {
  font-size: 1rem;
  color: #00AEC3;
  font-weight: 500;
}

@media (max-width: 600px) {
  .progress-modal {
    min-width: auto;
    padding: 2rem;
    margin: 1rem;
  }

  .progress-percentage-big {
    font-size: 3.5rem;
  }

  .percent-symbol {
    font-size: 1.8rem;
  }

  .phase-icon {
    width: 40px;
    height: 40px;
  }

  .phase-connector {
    width: 40px;
  }
}
</style>
