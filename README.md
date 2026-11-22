# ICS 2026 — TPI

Backend de e-commerce (.NET 8) con pipeline de GitHub Actions hacia Docker Hub y Azure App Service.

## Documentación

- [Pruebas E2E](docs/pruebas-e2e.md): flujo automatizado de creación de productos, listado y creación de orden (Postman / Newman).
- [CI/CD y bloqueo de deploy](docs/ci-cd.md): job de pruebas obligatorio; si falla, no se construye ni se despliega.
- [Enunciado original del backend](Dsw2025Tpi-development/README.md)

## Pruebas E2E en local

Requiere Docker y Node.js.

```bash
chmod +x tests/e2e/run-e2e.sh
./tests/e2e/run-e2e.sh
```
