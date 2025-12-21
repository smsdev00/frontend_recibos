import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  }),
}

vi.stubGlobal('localStorage', localStorageMock)

// Mock del módulo de API
vi.mock('@/services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}))

import { authApi } from '@/services/api'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('estado inicial', () => {
    it('debería inicializar con valores por defecto', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('debería cargar token desde localStorage si existe', () => {
      localStorageMock.store['access_token'] = 'existing-token'

      const store = useAuthStore()

      expect(store.token).toBe('existing-token')
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('hasRole', () => {
    it('debería retornar false si no hay usuario', () => {
      const store = useAuthStore()

      expect(store.hasRole(['administrador'])).toBe(false)
    })

    it('debería retornar true si el usuario tiene el rol', () => {
      const store = useAuthStore()
      store.user = { id: 1, username: 'admin', email: 'admin@test.com', role: 'administrador' }

      expect(store.hasRole(['administrador'])).toBe(true)
    })

    it('debería retornar false si el usuario no tiene el rol', () => {
      const store = useAuthStore()
      store.user = { id: 1, username: 'user', email: 'user@test.com', role: 'mesaayuda' }

      expect(store.hasRole(['administrador'])).toBe(false)
    })
  })

  describe('computed roles', () => {
    it('isAdmin debería ser true para administrador', () => {
      const store = useAuthStore()
      store.user = { id: 1, username: 'admin', email: 'admin@test.com', role: 'administrador' }

      expect(store.isAdmin).toBe(true)
      expect(store.isMesaAyuda).toBe(true)
      expect(store.canManageLiquidaciones).toBe(true)
    })

    it('isMesaAyuda debería ser true para mesaayuda', () => {
      const store = useAuthStore()
      store.user = { id: 1, username: 'user', email: 'user@test.com', role: 'mesaayuda' }

      expect(store.isAdmin).toBe(false)
      expect(store.isMesaAyuda).toBe(true)
    })

    it('canViewLiquidaciones debería funcionar para roles permitidos', () => {
      const store = useAuthStore()

      const rolesConPermiso = ['administrador', 'liquidaciones', 'mesaayuda', 'gerencial']

      for (const role of rolesConPermiso) {
        store.user = { id: 1, username: 'user', email: 'user@test.com', role }
        expect(store.canViewLiquidaciones).toBe(true)
      }
    })
  })

  describe('login', () => {
    it('debería hacer login exitosamente', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-token',
          refresh_token: 'refresh-token',
          user: { id: 1, username: 'admin', email: 'admin@test.com', role: 'administrador' },
        },
      }
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any)

      const store = useAuthStore()
      const result = await store.login('admin', 'password')

      expect(result).toBe(true)
      expect(store.token).toBe('new-token')
      expect(store.user?.username).toBe('admin')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'new-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token')
    })

    it('debería manejar error de credenciales incorrectas', async () => {
      vi.mocked(authApi.login).mockRejectedValue({
        response: { status: 401, data: { detail: 'Credenciales incorrectas' } },
      })

      const store = useAuthStore()
      const result = await store.login('admin', 'wrong-password')

      expect(result).toBe(false)
      expect(store.error).toBe('Credenciales incorrectas')
      expect(store.token).toBeNull()
    })

    it('debería manejar error de conexión', async () => {
      vi.mocked(authApi.login).mockRejectedValue({
        request: {},
      })

      const store = useAuthStore()
      const result = await store.login('admin', 'password')

      expect(result).toBe(false)
      expect(store.error).toBe('No se pudo conectar al servidor')
    })
  })

  describe('logout', () => {
    it('debería limpiar el estado al hacer logout', async () => {
      const store = useAuthStore()
      store.token = 'some-token'
      store.user = { id: 1, username: 'admin', email: 'admin@test.com' }
      localStorageMock.store['access_token'] = 'some-token'
      localStorageMock.store['refresh_token'] = 'some-refresh-token'

      vi.mocked(authApi.logout).mockResolvedValue({} as any)

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token')
    })

    it('debería limpiar el estado incluso si la API falla', async () => {
      const store = useAuthStore()
      store.token = 'some-token'
      store.user = { id: 1, username: 'admin', email: 'admin@test.com' }

      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'))

      await store.logout()

      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })
  })

  describe('fetchUser', () => {
    it('debería retornar false si no hay token', async () => {
      const store = useAuthStore()

      const result = await store.fetchUser()

      expect(result).toBe(false)
      expect(authApi.me).not.toHaveBeenCalled()
    })

    it('debería obtener el usuario correctamente', async () => {
      localStorageMock.store['access_token'] = 'valid-token'
      const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', role: 'administrador' }
      vi.mocked(authApi.me).mockResolvedValue({ data: mockUser } as any)

      const store = useAuthStore()
      const result = await store.fetchUser()

      expect(result).toBe(true)
      expect(store.user).toEqual(mockUser)
    })

    it('debería limpiar tokens si la API falla', async () => {
      localStorageMock.store['access_token'] = 'invalid-token'
      vi.mocked(authApi.me).mockRejectedValue(new Error('Unauthorized'))

      const store = useAuthStore()
      const result = await store.fetchUser()

      expect(result).toBe(false)
      expect(store.token).toBeNull()
      expect(store.user).toBeNull()
    })
  })
})
