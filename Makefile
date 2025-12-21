.PHONY: dev build test test-watch test-coverage lint preview clean install

# Desarrollo
dev:
	npm run dev

# Build
build:
	npm run build

preview:
	npm run preview

# Testing
test:
	npm run test:run

test-watch:
	npm run test

test-coverage:
	npm run test:coverage

# Instalación
install:
	npm install

# Limpieza
clean:
	rm -rf node_modules dist .vitest

# Ayuda
help:
	@echo "Comandos disponibles:"
	@echo "  make dev           - Inicia el servidor de desarrollo"
	@echo "  make build         - Compila el proyecto para producción"
	@echo "  make preview       - Previsualiza el build de producción"
	@echo "  make test          - Ejecuta los tests una vez"
	@echo "  make test-watch    - Ejecuta los tests en modo watch"
	@echo "  make test-coverage - Ejecuta los tests con cobertura"
	@echo "  make install       - Instala las dependencias"
	@echo "  make clean         - Limpia node_modules y dist"
