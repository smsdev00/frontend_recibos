<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { liquidacionesApi } from '@/services/api'
import { useConstantsStore } from '@/stores/constants'
import type { TipoLiquidacionInfo } from '@/types'

const router = useRouter()
const constantsStore = useConstantsStore()

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

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

async function handleSubmit() {
  const archivoPersonal = form.value.archivo_personal
  const archivoRecibos = form.value.archivo_recibos

  if (!archivoPersonal || !archivoRecibos) {
    error.value = 'Debe seleccionar ambos archivos'
    return
  }

  loading.value = true
  error.value = null
  success.value = null

  try {
    const formData = new FormData()
    formData.append('archivo_personal', archivoPersonal)
    formData.append('archivo_recibos', archivoRecibos)
    formData.append('mes', String(form.value.mes))
    formData.append('anio', String(form.value.anio))
    formData.append('tipo', String(form.value.tipo))
    formData.append('fecha_activacion', form.value.fecha_activacion)

    const response = await liquidacionesApi.procesar(formData)
    const data = response.data

    success.value = `${data.mensaje}. Registros de personal: ${data.registros_personal}, Recibos: ${data.registros_recibos}`

    setTimeout(() => {
      router.push('/liquidaciones')
    }, 3000)
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
    error.value = axiosError.response?.data?.error?.message || 'Error al procesar la liquidacion'
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
            <label for="anio">Anio *</label>
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
  color: #4a90a4;
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
  border-color: #4a90a4;
  box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.1);
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
  border-color: #4a90a4;
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
