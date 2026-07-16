BINARY := kube-migrate
GO := go

.PHONY: all build build-ui build-go test clean run-ui run-scan dev-ui install help tidy lint vet

## all: Build everything (UI + Go binary)
all: build

## build: Build React UI then Go binary with embedded UI
build: build-ui build-go

## build-ui: Build the React frontend
build-ui:
	cd web && npm install && npm run build

## build-go: Build the Go binary
build-go:
	CGO_ENABLED=0 $(GO) build -o $(BINARY) .

## test: Run all Go tests with race detector and coverage
test:
	$(GO) test -race -coverprofile=coverage.out ./...
	@echo "Coverage report: coverage.out"

## vet: Run go vet
vet:
	$(GO) vet ./...

## lint: Run golangci-lint (falls back to go vet if not installed)
lint:
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found, falling back to go vet"; \
		$(GO) vet ./...; \
	fi

## run-ui: Start the local UI (requires cluster access)
run-ui: build
	./$(BINARY) ui

## run-scan: Quick scan of your current cluster
run-scan: build
	./$(BINARY) scan

## install: Install binary to /usr/local/bin
install: build
	cp $(BINARY) /usr/local/bin/$(BINARY)
	@echo "Installed to /usr/local/bin/$(BINARY)"

## dev-ui: Run UI in dev mode (Vite dev server, requires kube-migrate ui running on :8080)
dev-ui:
	cd web && npm run dev

## clean: Remove build artifacts
clean:
	rm -f $(BINARY)
	rm -rf web/node_modules web/dist pkg/server/dist

## help: Show this help
help:
	@grep -E '^## ' Makefile | sed 's/^## //'

## tidy: Go mod tidy
tidy:
	$(GO) mod tidy
