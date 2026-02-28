#!/bin/bash
set -euo pipefail

echo "=== Installing Traefik v3 alongside NGINX ==="
echo "This is safe — NGINX continues serving all traffic"
echo ""

# Add Traefik Helm repo
helm repo add traefik https://traefik.github.io/charts
helm repo update

# Install Traefik with custom values
helm install traefik traefik/traefik \
  --namespace traefik-system \
  --create-namespace \
  -f "$(dirname "$0")/values.yaml" \
  --wait

echo ""
echo "✅ Traefik installed successfully"
echo "   Traefik LoadBalancer IP:"
kubectl get svc -n traefik-system traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
echo ""
