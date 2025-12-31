# Configuracion Frontend - Variables de Entorno y Nginx

## Resumen

El frontend NO usa variables de entorno en build time. La conexion al backend se resuelve en runtime via Nginx reverse proxy.

---

## Variables de Entorno

### Frontend (.env)

```env
VITE_API_URL=
```

**Estado actual**: Vacia. No se usa.

**En codigo** (`src/services/api.ts`):
```typescript
const API_URL = import.meta.env.VITE_API_URL || ''
```

Como `VITE_API_URL` esta vacia, `API_URL = ''`, lo que significa que todas las llamadas API son **relativas** al mismo host:
- `axios.get('/api/users')` → `GET http://localhost:5173/api/users`

---

## Arquitectura de Conexion

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│    Nginx    │────▶│  Symfony    │
│             │     │   (puerto   │     │  (puerto    │
│             │     │    5173)    │     │    80)      │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                    Reverse Proxy
                    /api/* → api-symfony:80
```

El frontend hace requests a `/api/*` en su propio dominio, y Nginx los proxea al backend.

---

## Nginx Configuration

**Archivo**: `nginx.conf.template`

### Variables de Entorno (Runtime)

| Variable | Default | Uso |
|----------|---------|-----|
| `API_HOST` | `api-symfony` | Hostname del container backend |
| `API_PORT` | `80` | Puerto del backend |

Estas variables se resuelven en **runtime** cuando el container inicia (no en build time).

### Rutas Configuradas

| Location | Destino | Descripcion |
|----------|---------|-------------|
| `/api/*` | `http://api-symfony:80/api/` | API REST |
| `/health` | `http://api-symfony:80/health` | Health check |
| `/*` | `/index.html` | SPA fallback |

### Configuraciones Importantes

```nginx
# Archivos grandes (liquidaciones)
client_max_body_size 50M;

# Timeouts para operaciones largas
proxy_read_timeout 300s;
proxy_send_timeout 300s;

# Cache de assets estaticos (1 año)
location ~* \.(js|css|png|...)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Dockerfile.frontend

### Build Stage
1. `npm ci` - Instala dependencias
2. `npm run build` - Genera `/dist` (assets estaticos)

### Production Stage
1. Copia `nginx.conf.template` a `/etc/nginx/templates/`
2. Copia `/dist` a `/usr/share/nginx/html`
3. Define `API_HOST=api` y `API_PORT=8300` como defaults
4. nginx:alpine procesa automaticamente los templates

---

## Flujo de Build y Deploy

```
1. Build (Docker)
   ├── npm run build
   └── Output: archivos estaticos en /dist
       └── NO contiene URLs de API hardcodeadas

2. Runtime (Container)
   ├── Nginx lee API_HOST y API_PORT del environment
   ├── Procesa nginx.conf.template → default.conf
   └── Proxea /api/* al backend
```

---

## docker-compose.yml (Relevante)

```yaml
frontend:
  environment:
    API_HOST: ${API_HOST:-api-symfony}    # Nombre del servicio backend
    API_PORT: ${API_INTERNAL_PORT:-80}    # Puerto interno del backend
  ports:
    - "${FRONTEND_PORT:-5173}:80"
  depends_on:
    - api-symfony
```

---

## Ventajas de esta Arquitectura

1. **Sin rebuild para cambiar backend**: Solo cambiar `API_HOST`/`API_PORT` y reiniciar container
2. **Sin CORS**: Frontend y API comparten el mismo origen desde el browser
3. **Cache eficiente**: Assets estaticos con cache de 1 año
4. **SSE funciona**: Nginx maneja conexiones de larga duracion para progreso en tiempo real

---

## Para Desarrollo Local (sin Docker)

Si se quiere correr `npm run dev` fuera de Docker, hay dos opciones:

### Opcion 1: Usar VITE_API_URL
```env
VITE_API_URL=http://localhost:8301
```

### Opcion 2: Configurar proxy en vite.config.ts
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8301'
    }
  }
})
```

Actualmente NO esta configurado, asi que desarrollo local requiere Docker o configurar una de estas opciones.
