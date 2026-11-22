#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.e2e.yml"
COLLECTION="$ROOT_DIR/tests/e2e/ics2026-e2e.postman_collection.json"
ENVIRONMENT="$ROOT_DIR/tests/e2e/ics2026-e2e.postman_environment.json"
BASE_URL="${BASE_URL:-http://localhost:8080}"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
}

if [[ "${KEEP_STACK:-0}" != "1" ]]; then
  trap cleanup EXIT
fi

echo "==> Levantando SQL Server y API para pruebas E2E"
docker compose -f "$COMPOSE_FILE" up -d --build

echo "==> Esperando a que la API responda en ${BASE_URL}/healthcheck"
for attempt in $(seq 1 40); do
  if curl -sf "${BASE_URL}/healthcheck" >/dev/null; then
    echo "==> API lista (intento ${attempt})"
    break
  fi
  if [[ "$attempt" -eq 40 ]]; then
    echo "La API no respondió a tiempo. Logs:"
    docker compose -f "$COMPOSE_FILE" logs
    exit 1
  fi
  sleep 3
done

echo "==> Ejecutando colección Newman (aborto ante el primer fallo)"
npx --yes newman@6 run "$COLLECTION" \
  -e "$ENVIRONMENT" \
  --env-var "baseUrl=${BASE_URL}" \
  --bail \
  --reporters cli,junit \
  --reporter-junit-export "$ROOT_DIR/tests/e2e/newman-results.xml"

echo "==> Pruebas E2E finalizadas con éxito"
