#!/bin/bash
set -euo pipefail

echo "=== Installing Envoy Gateway ==="
echo "This installs alongside NGINX — production traffic is unaffected"
echo ""

helm install eg oci://docker.io/envoyproxy/gateway-helm \
  --version v1.3.0 \
  -n envoy-gateway-system \
  --create-namespace \
  -f "$(dirname "$0")/values.yaml" \
  --wait

echo ""
echo "✅ Envoy Gateway installed"
kubectl get pods -n envoy-gateway-system
