# Contributing to kube-migrate

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Go 1.22+
- Node.js 20+ and npm
- `kubectl` configured with a Kubernetes cluster (for testing)
- Make

### Getting Started

```bash
# Clone the repo
git clone https://github.com/kube-migrate/kube-migrate.git
cd kube-migrate

# Install frontend dependencies
cd web && npm install && cd ..

# Run Go tests
go test ./...

# Build everything
make build

# Run the UI in dev mode (hot reload)
make dev-ui
```

### Project Layout

| Directory | Description |
|-----------|-------------|
| `cmd/` | Cobra CLI commands |
| `pkg/scanner/` | Kubernetes cluster scanning |
| `pkg/analyzer/` | Annotation compatibility mapping |
| `pkg/migrator/traefik/` | Traefik migration generation |
| `pkg/migrator/gatewayapi/` | Gateway API migration generation |
| `pkg/generator/` | Output file writing |
| `pkg/server/` | HTTP API server + embedded React UI |
| `web/` | React frontend (TypeScript + Tailwind) |
| `examples/` | Sample NGINX Ingress YAML files |

## Making Changes

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/my-feature`
3. **Make your changes** — follow existing code style
4. **Add tests** — all new logic should have test coverage
5. **Run tests**: `go test ./...`
6. **Build**: `make build` to verify everything compiles
7. **Commit** with a descriptive message
8. **Open a PR** against `main`

## Code Style

- Go: follow `gofmt` / `go vet` conventions
- TypeScript: Prettier defaults
- Commit messages: `feat:`, `fix:`, `docs:`, `test:`, `ci:` prefixes

## Adding Annotation Mappings

To add support for a new NGINX annotation:

1. Add an entry to `traefikMappings` in `pkg/analyzer/compatibility.go`
2. Add an entry to `gatewayAPIMappings` in the same file
3. Add migration generation logic in `pkg/migrator/traefik/migrator.go` and/or `pkg/migrator/gatewayapi/migrator.go`
4. Optionally add a guide in `pkg/server/guides.go`
5. Add a test case in `pkg/analyzer/analyzer_test.go`
6. Add an example YAML in `examples/` if the annotation is common

## Reporting Issues

- Use GitHub Issues
- Include: Go version, Kubernetes version, NGINX controller version
- Attach relevant Ingress YAML (redact secrets/hostnames)
- Include `kube-migrate scan --output json` output if possible

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
