# kube-migrate

Kubernetes Ingress migration tool — scan, analyze, and migrate from Ingress NGINX to Traefik or Gateway API.

## Tech Stack
- Backend: Go 1.22+ with Cobra CLI
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Build: Makefile (builds UI then embeds into Go binary)

## Project Structure
- `cmd/` — Cobra CLI commands (scan, analyze, migrate, ui)
- `pkg/scanner/` — Kubernetes cluster scanning
- `pkg/analyzer/` — Annotation compatibility mapping
- `pkg/migrator/traefik/` — Traefik migration generation
- `pkg/migrator/gatewayapi/` — Gateway API migration generation
- `pkg/generator/` — Output file writing
- `pkg/server/` — HTTP API server + embedded React UI
- `web/` — React frontend
- `examples/` — Sample NGINX Ingress YAML files
