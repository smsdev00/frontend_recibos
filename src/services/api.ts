import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type {
  LoginResponse,
  RefreshTokenResponse,
  User,
  PaginatedResponse,
  Liquidacion,
  LiquidacionProcesamiento,
  Personal,
  Recibo,
  ReciboCompleto,
  Constants,
  ErrorResponse
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar refresh token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Solo intentar refresh si es 401 y no es una ruta de auth
    const isAuthRoute = originalRequest.url?.includes('/auth/')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        isRefreshing = false
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post<RefreshTokenResponse>(
          `${API_URL || ''}/api/auth/refresh`,
          { refresh_token: refreshToken }
        )
        const { access_token } = response.data
        localStorage.setItem('access_token', access_token)
        processQueue(null, access_token)
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { username, password }),

  logout: () => api.post('/api/auth/logout'),

  refresh: (refresh_token: string) =>
    api.post<RefreshTokenResponse>('/api/auth/refresh', { refresh_token }),

  me: () => api.get<User>('/api/auth/me'),

  changeMyPassword: (password_actual: string, nueva_password: string) =>
    api.post('/api/auth/change-password', { password_actual, nueva_password }),

  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/api/auth/reset-password', { token, new_password })
}

// Users API
export const usersApi = {
  list: (params?: {
    page?: number
    per_page?: number
    username?: string
    legajo?: number
    nombre?: string
    email?: string
    role?: string
    activo?: number
  }) => api.get<PaginatedResponse<User>>('/api/users', { params }),

  search: (params?: {
    username?: string
    legajo?: number
    nombre?: string
    email?: string
    role?: string
    activo?: number
    limit?: number
    offset?: number
  }) => api.get<User[]>('/api/users/search', { params }),

  get: (id: number) => api.get<User>(`/api/users/${id}`),

  create: (data: {
    username: string
    email: string
    password: string
    role?: string
    legajo?: number
    nombre?: string
  }) => api.post<User>('/api/users', data),

  update: (id: number, data: {
    email?: string
    role?: string
    activo?: number
    password?: string
  }) => api.put<User>(`/api/users/${id}`, data),

  changePassword: (user_id: number, nueva_password: string) =>
    api.post('/api/users/change-password', { user_id, nueva_password })
}

// Liquidaciones API
export const liquidacionesApi = {
  list: (params?: {
    page?: number
    per_page?: number
    mes?: number
    anio?: number
    tipo?: number
  }) => api.get<PaginatedResponse<Liquidacion>>('/api/liquidaciones', { params }),

  get: (id: number) => api.get<Liquidacion>(`/api/liquidaciones/${id}`),

  procesar: (data: FormData) =>
    api.post<LiquidacionProcesamiento>('/api/liquidaciones/procesar', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  delete: (id: number) => api.delete(`/api/liquidaciones/${id}`),

  toggleActiva: (id: number) =>
    api.patch<{ mensaje: string; activa: boolean }>(`/api/liquidaciones/${id}/toggle-activa`)
}

// Personal API
export const personalApi = {
  list: (params?: {
    page?: number
    per_page?: number
    id?: number
    programa?: string
    agrupamiento?: string
    categoria?: number
    horas?: number
    anios?: number
    legajo?: number
    doc_nro?: number
    doc_tipo?: string
    cuil?: string
    ley?: string
    nombre?: string
  }) => api.get<PaginatedResponse<Personal>>('/api/personal', { params })
}

// Recibos API
export const recibosApi = {
  misRecibos: (params?: { page?: number; per_page?: number }) =>
    api.get<PaginatedResponse<Recibo>>('/api/recibos/mis-recibos', { params }),

  buscar: (params?: {
    page?: number
    per_page?: number
    dni?: number
    mes?: number
    anio?: number
    tipo?: number
    activa?: number
  }) => api.get<PaginatedResponse<Recibo>>('/api/recibos/buscar', { params }),

  get: (id: number) => api.get<ReciboCompleto>(`/api/recibos/${id}`),

  descargarPdf: async (id: number) => {
    const response = await api.get(`/api/recibos/${id}/pdf`, {
      responseType: 'blob'
    })
    return response
  }
}

// Constants API
export const constantsApi = {
  get: () => api.get<Constants>('/api/constants')
}

// Health API
export const healthApi = {
  check: () => api.get<{ status: string; database: string }>('/health')
}

export default api
