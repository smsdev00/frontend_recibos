<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)

function goToRegister() {
  router.push('/register')
}

async function handleLogin() {
  const success = await authStore.login(username.value, password.value)
  if (success) {
    // Si el rol es 'usuario', ir directamente a mis recibos
    if (authStore.userRole === 'usuario') {
      router.push('/mis-recibos')
    } else {
      router.push('/dashboard')
    }
  }
}

function isNumberKey(event: KeyboardEvent) {
  const charCode = event.keyCode || event.which
  if (charCode < 48 || charCode > 57) {
    event.preventDefault()
  }
}

function limitUsernameLength(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.value.length > 9) {
    input.value = input.value.slice(0, 9)
    username.value = input.value
  }
}

function limitPasswordLength(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.value.length > 100) {
    input.value = input.value.slice(0, 100)
    password.value = input.value
  }
}

</script>

<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-top-header"></div>
      <div class="login-card">
      <div class="login-header">
        <h1>Sistema de Recibos Web</h1>
        <p>Ingrese sus credenciales para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Usuario</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Ingrese su usuario"
            required
            minlength="6"
            maxlength="9"
            autocomplete="username"
            @keypress="isNumberKey"
            @input="limitUsernameLength"
        />
        </div>

        <div class="form-group">
          <label for="password">Contrasena</label>
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Ingrese su contraseña"
              required
              maxlength="100"
              autocomplete="current-password"
              @input="limitPasswordLength"
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

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          class="btn-login"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Ingresando...' : 'Ingresar' }}
        </button>

        <div class="register-link">
          No tiene cuenta?
          <a href="#" @click.prevent="goToRegister">Registrarse</a>
        </div>
      </form>
    </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-secondary) 100%);
  padding: 1rem;
}

.login-wrapper {
  width: 100%;
  max-width: 400px;
}

.login-top-header {
  height: 60px;
  background-image: url('/logo_provincia.png');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: left center;
  margin-bottom: 1rem;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 2.5rem;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #1a1a2e;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #666;
  font-size: 0.9rem;
}

.login-form {
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
  border-color: var(--pba-celeste);
  box-shadow: 0 0 0 3px rgba(0, 152, 217, 0.15);
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
  color: var(--pba-celeste);
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

.btn-login {
  background: var(--pba-gradient);
  color: var(--text-inverse);
  border: none;
  padding: 0.875rem;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-gradient);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.register-link a {
  color: var(--pba-celeste);
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
