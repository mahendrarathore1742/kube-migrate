FROM golang:1.22-alpine AS builder

RUN apk add --no-cache nodejs npm make git

WORKDIR /app

# Go dependencies
COPY go.mod go.sum ./
RUN go mod download

# Frontend dependencies
COPY web/package.json web/package-lock.json ./web/
RUN cd web && npm ci

# Copy source
COPY . .

# Build frontend + Go binary
RUN cd web && npm run build
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w -X github.com/kube-migrate/kube-migrate/cmd.Version=$(git describe --tags --always --dirty 2>/dev/null || echo dev)" -o /kube-migrate .

# --- Runtime ---
FROM alpine:3.20

RUN apk add --no-cache ca-certificates

COPY --from=builder /kube-migrate /usr/local/bin/kube-migrate

ENTRYPOINT ["kube-migrate"]
