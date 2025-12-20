<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>Pagina no encontrada</h2>
      <p>La pagina que buscas no existe o ha sido movida.</p>
      <button @click="goHome" class="btn btn-primary">
        Ir al Inicio
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  text-align: center;
}

.content h1 {
  font-size: 6rem;
  color: #1a1a2e;
  margin: 0;
  line-height: 1;
}

.content h2 {
  color: #374151;
  font-size: 1.5rem;
  margin: 1rem 0 0.5rem;
}

.content p {
  color: #666;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background: #00AEC3;
  color: #fff;
}

.btn-primary:hover {
  background: #009AAD;
}
</style>
