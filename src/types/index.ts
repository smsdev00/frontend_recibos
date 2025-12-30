// Tipos de la API

export interface User {
  id: number
  username: string
  email: string
  role?: string
  legajo?: number
  nombre?: string
  activo?: number
  created?: string
  modified?: string
}

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  user: User
}

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// Liquidaciones
export interface Liquidacion {
  id: number
  mes: number
  anio: number
  tipo: number
  estado: number
  activa: number
  fecha_activacion?: string
  created?: string
}

export interface LiquidacionProcesamiento {
  liquidacion_id: number
  mes?: number
  anio?: number
  tipo?: number
  registros_personal?: number
  registros_recibos?: number
  mensaje: string
  // Python (FastAPI) devuelve ws_url, Symfony devuelve sse_url
  ws_url?: string
  sse_url?: string
}

// Personal
export interface Personal {
  id: number
  programa: string
  agrupamiento: string
  categoria: number
  horas: number
  anios: number
  personal_x_liquidaciones: number
  legajo: number
  created: string
  doc_nro: number
  doc_tipo: string
  cuil: number
  ley: number
  nombre: string
}

// Recibos
export interface ReciboConcepto {
  id: number
  codigo: string
  texto: string
  monto: number
  tipo?: string
}

export interface Recibo {
  id: number
  legajo: number
  created: string
  recibos_x_liquidaciones: number
  mes: number
  anio: number
  tipo: number
  activa: number
}

export interface ReciboCompleto extends Recibo {
  modified: string
  fecha_activacion?: string
  conceptos: ReciboConcepto[]
}

// Constantes
export interface RoleInfo {
  id: string
  nombre: string
  descripcion: string
  permisos: string[]
}

export interface TipoLiquidacionInfo {
  id: number
  nombre: string
  descripcion: string
}

export interface EstadoLiquidacionInfo {
  id: number
  nombre: string
  descripcion: string
}

export interface Constants {
  roles: RoleInfo[]
  tipos_liquidacion: TipoLiquidacionInfo[]
  estados_liquidacion: EstadoLiquidacionInfo[]
}
