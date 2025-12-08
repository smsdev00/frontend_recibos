import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { constantsApi } from '@/services/api'
import type { Constants, RoleInfo, TipoLiquidacionInfo, EstadoLiquidacionInfo } from '@/types'

export const useConstantsStore = defineStore('constants', () => {
  const constants = ref<Constants | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const roles = computed(() => constants.value?.roles || [])
  const tiposLiquidacion = computed(() => constants.value?.tipos_liquidacion || [])
  const estadosLiquidacion = computed(() => constants.value?.estados_liquidacion || [])

  const getRoleName = (roleId: string): string => {
    const role = roles.value.find((r: RoleInfo) => r.id === roleId)
    return role?.nombre || roleId
  }

  const getTipoLiquidacionName = (tipoId: number): string => {
    const tipo = tiposLiquidacion.value.find((t: TipoLiquidacionInfo) => t.id === tipoId)
    return tipo?.nombre || `Tipo ${tipoId}`
  }

  const getEstadoLiquidacionName = (estadoId: number): string => {
    const estado = estadosLiquidacion.value.find((e: EstadoLiquidacionInfo) => e.id === estadoId)
    return estado?.nombre || `Estado ${estadoId}`
  }

  async function fetchConstants() {
    if (constants.value) return // Ya cargadas
    loading.value = true
    error.value = null
    try {
      const response = await constantsApi.get()
      constants.value = response.data
    } catch (err: unknown) {
      const axiosError = err as { message?: string }
      error.value = axiosError.message || 'Error al cargar constantes'
    } finally {
      loading.value = false
    }
  }

  return {
    constants,
    loading,
    error,
    roles,
    tiposLiquidacion,
    estadosLiquidacion,
    getRoleName,
    getTipoLiquidacionName,
    getEstadoLiquidacionName,
    fetchConstants
  }
})
