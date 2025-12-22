<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/api'

const router = useRouter()

const dni = ref('')
const legajo = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function handleRegister() {
  error.value = null

  // Validar passwords
  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  loading.value = true

  try {
    await authApi.register(
      parseInt(dni.value),
      parseInt(legajo.value),
      email.value,
      password.value
    )
    success.value = true
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: any) {
    if (err.response?.data?.error?.message) {
      error.value = err.response.data.error.message
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail
    } else {
      error.value = 'Error al registrar. Verifique los datos ingresados.'
    }
  } finally {
    loading.value = false
  }
}

function isNumberKey(event: KeyboardEvent) {
  const charCode = event.keyCode || event.which
  if (charCode < 48 || charCode > 57) {
    event.preventDefault()
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-wrapper">
      <div class="register-top-header"></div>
      <div class="register-card">
        <div class="register-header">
          <h1>Registro de Usuario</h1>
          <p>Complete los datos para crear su cuenta</p>
        </div>

        <div v-if="success" class="success-message">
          Registro exitoso. Redirigiendo al login...
        </div>

        <form v-else @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="dni">DNI</label>
            <input
              id="dni"
              v-model="dni"
              type="text"
              placeholder="Ingrese su DNI"
              required
              minlength="6"
              @keypress="isNumberKey"
            />
          </div>

          <div class="form-group">
            <label for="legajo">Legajo</label>
            <input
              id="legajo"
              v-model="legajo"
              type="text"
              placeholder="Ingrese su legajo"
              required
              minlength="6"
              @keypress="isNumberKey"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Ingrese su email"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="password-input">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Ingrese su contraseña"
                required
                minlength="6"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'Ocultar' : 'Ver' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <div class="password-input">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Confirme su contraseña"
                required
                minlength="6"
              />
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button
            type="submit"
            class="btn-register"
            :disabled="loading"
          >
            {{ loading ? 'Registrando...' : 'Registrarse' }}
          </button>

          <div class="login-link">
            Ya tiene cuenta?
            <a href="#" @click.prevent="goToLogin">Iniciar sesion</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 1rem;
}

.register-wrapper {
  width: 100%;
  max-width: 400px;
}

.register-top-header {
  height: 60px;
  background-image: url('/logo_provincia.png');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: left center;
  margin-bottom: 1rem;
}

.register-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  width: 100%;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.register-header p {
  color: #666;
  font-size: 0.9rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #00AEC3;
  box-shadow: 0 0 0 3px rgba(74, 144, 164, 0.1);
}

.password-input {
  position: relative;
  display: flex;
}

.password-input input {
  flex: 1;
  padding-right: 4.5rem;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #00AEC3;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.25rem;
}

.toggle-password:hover {
  text-decoration: underline;
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.success-message {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  text-align: center;
}

.btn-register {
  background: linear-gradient(135deg, #00AEC3 0%, #009AAD 100%);
  color: #fff;
  border: none;
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 164, 0.4);
}

.btn-register:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.login-link a {
  color: #00AEC3;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
