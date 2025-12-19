import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)

  const hasRole = (roles: string[]) => {
    if (!user.value?.role) return false
    return roles.includes(user.value.role)
  }

  const isAdmin = computed(() => hasRole(['administrador']))
  const isMesaAyuda = computed(() => hasRole(['administrador', 'mesaayuda']))
  const canManageLiquidaciones = computed(() =>
    hasRole(['administrador', 'liquidaciones'])
  )
  const canViewLiquidaciones = computed(() =>
    hasRole(['administrador', 'liquidaciones', 'mesaayuda', 'gerencial'])
  )
  const canViewPersonal = computed(() =>
    hasRole(['administrador', 'mesaayuda', 'liquidaciones', 'gerencial'])
  )
  const canSearchRecibos = computed(() =>
    hasRole(['administrador', 'mesaayuda', 'gerencial'])
  )

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(username, password)
      const data = response.data
      token.value = data.access_token
      user.value = data.user as User
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      return true
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { detail?: string } }
        request?: unknown
        code?: string
      }

      if (axiosError.response) {
        error.value = axiosError.response.data?.detail || 'Credenciales incorrectas'
      } else if (axiosError.request) {
        error.value = 'No se pudo conectar al servidor'
      } else {
        error.value = 'Error al realizar la solicitud'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Ignorar errores de logout
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  async function fetchUser() {
    if (!token.value) return false
    loading.value = true
    try {
      const response = await authApi.me()
      user.value = response.data
      return true
    } catch {
      token.value = null
      user.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return false
    } finally {
      loading.value = false
    }
  }

  async function initialize() {
    if (token.value) {
      await fetchUser()
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    userRole,
    hasRole,
    isAdmin,
    isMesaAyuda,
    canManageLiquidaciones,
    canViewLiquidaciones,
    canViewPersonal,
    canSearchRecibos,
    login,
    logout,
    fetchUser,
    initialize
  }
})
